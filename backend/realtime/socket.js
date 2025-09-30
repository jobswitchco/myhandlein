// realtime/socket.js
import pkg from "socket.io";
const { Server: IOServer } = pkg;
import cookie from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Conversation from "../models/Conversations.js";
import Message from "../models/Messages.js";
import USER from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "NidkPwke9485hfKDLAndu9*#&$&$jcbPOqkPkshEYfk3848Asj";

export default function attachSocket(server, expressApp) {
  const io = new IOServer(server, {
    cors: {
      origin: expressApp.get("cors_origins") || "*",
      credentials: true,
    },
  });

  // helper: extract participant token from cookies (cookie name used earlier)
  function extractParticipantFromHandshake(handshake) {
    try {
      const cookiesHeader = handshake.headers?.cookie || "";
      const parsed = cookie.parse(cookiesHeader || "");
      const token = parsed.tokenParticipantMyHandle || null;
      if (!token) return null;
      const payload = jwt.verify(token, JWT_SECRET);
      // payload should contain userId/email - adapt to your generateJWTtoken
      return { participantId: payload.userId || payload.user_id || payload.id, payload };
    } catch (err) {
      return null;
    }
  }

  // middleware for handshake: attach optional subdomain and participant info
  io.use((socket, next) => {
    const { subdomain } = socket.handshake.query || {};
    socket.handshake.subdomain = subdomain;
    const participant = extractParticipantFromHandshake(socket.handshake);
    if (participant) socket.handshake.participant = participant;
    return next();
  });

  io.on("connection", async (socket) => {
    try {
      console.log("socket connected", socket.id, "subdomain:", socket.handshake.subdomain);

      // If the client provided subdomain, resolve influencer and join a public room for that influencer
      if (socket.handshake.subdomain) {
        const sub = String(socket.handshake.subdomain).toLowerCase();
        try {
          const user = await USER.findOne({ handleUserName: sub }).lean();
          if (user) {
            socket.join(`influencer:${String(user._id)}`);
            socket.data.influencer = { id: String(user._id), handle: sub, name: user.name, picture: user.picture };
          }
        } catch (err) {
          console.warn("influencer lookup failed:", err?.message || err);
        }
      }

      // If authenticated participant, also join participant room for their id
      if (socket.handshake.participant && socket.handshake.participant.participantId) {
        socket.join(`participant:${socket.handshake.participant.participantId}`);
        socket.data.participantId = String(socket.handshake.participant.participantId);
      }

      // Client can explicitly join a conversation room
      socket.on("join_conversation", async ({ conversationId }) => {
        try {
          if (!conversationId) return;
          socket.join(`conversation:${conversationId}`);
        } catch (err) {
          console.error("join_conversation error:", err);
        }
      });

      // Typing indicator broadcast
      socket.on("typing", ({ conversationId, isTyping }) => {
        if (!conversationId) return;
        const fromParticipantId = socket.data.participantId || null;
        const fromInfluencerId = socket.data.influencer?.id || null;
        const from = fromParticipantId || fromInfluencerId || null;

        socket.to(`conversation:${conversationId}`).emit("typing", {
          conversationId,
          isTyping,
          from,
          fromSocketId: socket.id,
        });
      });

      // Core: send message (client should call this)
      // payload: { conversationId (optional), to_influencer_id, text, attachments }
   // replace the existing "message:send" handler with this block
socket.on("message:send", async (payload) => {
  try {
    const { conversationId, to_influencer_id, text, attachments } = payload || {};
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    // who is connected on this socket?
    const participantId = socket.data.participantId || null; // participant_user id (follower)
    const influencerSocketUserId = socket.data.influencer?.id || null; // influencer (User) id

    // convert to ObjectIds where appropriate
    const participantObjectId = participantId && mongoose.Types.ObjectId.isValid(participantId)
      ? new mongoose.Types.ObjectId(participantId)
      : null;
    const influencerSocketObjectId = influencerSocketUserId && mongoose.Types.ObjectId.isValid(influencerSocketUserId)
      ? new mongoose.Types.ObjectId(influencerSocketUserId)
      : null;
    const explicitToInfluencerId = to_influencer_id && mongoose.Types.ObjectId.isValid(to_influencer_id)
      ? new mongoose.Types.ObjectId(to_influencer_id)
      : null;

    // Resolve conversation (existing or create)
    let convo = null;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      convo = await Conversation.findById(conversationId);
    } else {
      // fallback: if payload provided to_influencer_id or socket had influencer, create/find DM
      const influencerForDM = explicitToInfluencerId || influencerSocketObjectId;
      if (!influencerForDM) {
        socket.emit("error", { message: "conversationId or to_influencer_id required" });
        return;
      }
      // Build deterministic participant_ids_sorted and find/create convo
      const idsForKey = [String(influencerForDM)];
      if (participantObjectId) idsForKey.push(String(participantObjectId));
      const participant_ids_sorted = idsForKey.sort().join("|");
      convo = await Conversation.findOne({
        participant_ids_sorted,
        "metadata.conversation_type": "dm",
        is_deleted: { $ne: true }
      });
      if (!convo) {
        const participants = [
          { user: influencerForDM, role: "influencer", joined_at: new Date() }
        ];
        if (participantObjectId) participants.push({ user: participantObjectId, role: "member", joined_at: new Date() });
        convo = await Conversation.create({
          participants,
          participant_ids_sorted,
          last_message: null,
          unread_counts: participantObjectId ? { [String(influencerForDM)]: 0, [String(participantObjectId)]: 0 } : { [String(influencerForDM)]: 0 },
          metadata: { conversation_type: "dm" }
        });
      }
    }

    if (!convo) {
      socket.emit("error", { message: "failed to resolve conversation" });
      return;
    }

    // Determine sender (prefer participant, then influencer, else guest)
    let senderObjectId = null;
    let senderType = "guest";
    if (participantObjectId) {
      // follower sending
      senderObjectId = participantObjectId;
      senderType = "user";
    } else if (influencerSocketObjectId) {
      // influencer sending
      senderObjectId = influencerSocketObjectId;
      senderType = "user";
    } else {
      senderObjectId = null;
      senderType = "guest";
    }

    // Compute recipients: all other User IDs in the conversation participants (exclude sender)
    const convoParticipants = Array.isArray(convo.participants) ? convo.participants : [];
    const recipientIds = [];
    for (const p of convoParticipants) {
      const uid = (p && p.user) ? String(p.user) : null;
      if (!uid) continue;
      if (senderObjectId && String(senderObjectId) === uid) continue; // exclude sender
      recipientIds.push(uid);
    }

    const recipientObjectIds = recipientIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Build message doc (new Message schema)
    const messagePayload = {
      conversation: convo._id,
      sender: senderObjectId || null,          // User ObjectId or null for guest
      sender_type: senderType,                 // "user" or "guest"
      recipients: recipientObjectIds,
      text: trimmed,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: "sent",
      is_deleted: false
    };

    const created = await Message.create(messagePayload);

    // populate sender (for UI) if possible
    const populatedMessage = await Message.findById(created._id)
      .populate({ path: "sender", model: "User", select: "_id name handleUserName picture" })
      .lean();

    // Update conversation.last_message (store Message _id) and increment unread count for recipients
    const updateOps = { $set: { last_message: created._id, updatedAt: new Date() } };
    if (recipientIds.length) {
      updateOps.$inc = {};
      for (const rid of recipientIds) {
        updateOps.$inc[`unread_counts.${rid}`] = 1;
      }
    }
    await Conversation.findByIdAndUpdate(convo._id, updateOps).catch(e => {
      console.warn("Failed to update conversation last_message/unread:", e?.message || e);
    });

    // Ensure sender socket joins conversation room
    socket.join(`conversation:${String(convo._id)}`);

    // Emit to each recipient's influencer/participant rooms and conversation room
    // If recipient matches a User (influencer) -> emit to influencer:<id> room; if recipient is a participant-user, you might also have participant:<id> rooms
    for (const rid of recipientIds) {
      // try both influencer room and participant room names to be safe
      io.to(`influencer:${String(rid)}`).emit("message:received", { message: populatedMessage });
      io.to(`participant:${String(rid)}`).emit("message:received", { message: populatedMessage });
    }

    // emit into conversation room
    io.to(`conversation:${String(convo._id)}`).emit("message:received", { message: populatedMessage });

    // ack back to sender socket
    socket.emit("message:saved", { message: populatedMessage });
  } catch (err) {
    console.error("message:send error:", err);
    socket.emit("error", { message: "message send failed", details: err?.message || null });
  }
});


      socket.on("disconnect", () => {
        console.log("socket disconnected", socket.id);
      });
    } catch (outerErr) {
      console.error("socket connection handler error:", outerErr);
    }
  });

  return io;
}
