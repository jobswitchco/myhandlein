import ActionLock from "../models/ActionLock.js";
import redis from "../../src/realtime/redis.js";
import { replyToCommentPublic, sendInitialDM } from "../services/metaSender.js";
import { ensureFreshPageTokenForUser } from "../services/tokenService.js";
import Automation from "../models/Automation.js";



const MAX_ATTEMPTS = 5;
const RATE_LIMIT_PER_HOUR = 700;

function getHourKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
}

async function canSendNow(creatorId) {
  const key = `rl:${creatorId}:${getHourKey()}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600);
  }

  return count <= RATE_LIMIT_PER_HOUR;
}

function randomRescheduleSeconds() {
  const buckets = [20, 42, 60, 86, 120];
  const bucket = buckets[Math.floor(Math.random() * buckets.length)];
  return Math.floor(Math.random() * bucket) + 1;
}

export const defineProcessActionLockJob = (agenda) => {
  agenda.define("process_action_lock", async (job) => {

    const { actionLockId } = job.attrs.data;


    const lock = await ActionLock.findById(actionLockId);
    if (!lock) return;

    if (lock.state !== "queued") return;

    // ❌ Stop infinite retries
    if (lock.attempt >= MAX_ATTEMPTS) {
      await ActionLock.updateOne(
        { _id: lock._id },
        { state: "failed", lastError: { reason: "Max attempts reached" } }
      );
      return;
    }

    // 🔐 Rate limit check
    const allowed = await canSendNow(lock.payload.creatorId);
    console.log('Allowed : ', allowed);

    if (!allowed) {
      const delaySec = randomRescheduleSeconds();
      const nextTime = new Date(Date.now() + delaySec * 1000);

      await ActionLock.updateOne(
        { _id: lock._id },
        {
          $set: { scheduledAt: nextTime },
          $inc: { attempt: 1 },
        }
      );

      await agenda.schedule(nextTime, "process_action_lock", {
        actionLockId: lock._id,
      });

      return;
    }

    try {

        const { fbPageAccessToken } = await ensureFreshPageTokenForUser(
  lock.payload.creatorId
);
      // 🔥 EXECUTION
      if (lock.channel === "public") {
        await replyToCommentPublic(
          lock.commentId,
          lock.payload.replyText,
          fbPageAccessToken
        );
      }

      if (lock.channel === "private") {
        const automation = await Automation.findById(lock.automationId)
        await sendInitialDM({
          fbPageId: lock.payload.pageId,
          commentId: lock.commentId,
          automation,
          pageAccessToken: fbPageAccessToken,
          igUserId: lock.payload.igUserId,
          igUsername: lock.payload.igUsername,
        });
      }

      await ActionLock.updateOne(
        { _id: lock._id },
        { state: "sent", sentAt: new Date() }
      );
    } catch (err) {
      const delaySec = randomRescheduleSeconds();

      await ActionLock.updateOne(
        { _id: lock._id },
        {
          $set: {
            scheduledAt: new Date(Date.now() + delaySec * 1000),
            lastError: { message: err.message },
          },
          $inc: { attempt: 1 },
        }
      );

      await agenda.schedule(
        new Date(Date.now() + delaySec * 1000),
        "process_action_lock",
        { actionLockId: lock._id }
      );
    }
  });
};
