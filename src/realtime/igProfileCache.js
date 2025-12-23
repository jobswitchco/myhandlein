const { redisGet, redisSet } = require("./redisBridge");
const { acquireLock, releaseLock } = require("./redisLock");

const PROFILE_TTL = 3600; // 1 hour

/**
 * READ-ONLY: Safe for UI
 */
async function getCachedProfile(igUserId) {
  if (!igUserId) return null;
  return await redisGet(`ig:user:${igUserId}`);
}

let InstagramService = null;

async function getInstagramService() {
  if (!InstagramService) {
    const mod = await import("../../backend/middleware/instagramService.js");
    InstagramService = mod.default || mod;
  }
  return InstagramService;
}


/**
 * WRITE: Background only
 */
async function fetchAndCacheProfileSafely({
  igUserId,
  accessToken,
  conversationId,
  publishSocketEvent,
}) {
  const cacheKey = `ig:user:${igUserId}`;

  // Fast path
  const cached = await redisGet(cacheKey);
  if (cached) return cached;

  // Lock
  const locked = await acquireLock(`ig:user:${igUserId}`, 30);
  if (!locked) return null;

  try {
   
    const InstagramService = await getInstagramService();

const profile = await InstagramService.fetchUserProfile({
  igUserId,
  accessToken,
});


    if (!profile) return null;

    const payload = {
      igUserId,
      name: profile.name || null,
      profilePic: profile.profile_pic_url || null,
      restricted: profile.is_private || false,
      fetchedAt: Date.now(),
    };

    await redisSet(cacheKey, payload, PROFILE_TTL);

    // 🔥 Optional realtime update
    if (conversationId && publishSocketEvent) {
      await publishSocketEvent({
        conversationId,
        payload: {
          type: "participant:updated",
          conversationId: conversationId.toString(),
          data: {
            igUserId,
            name: payload.name,
            profilePic: payload.profilePic,
          },
        },
      });
    }

    return payload;
  } catch (err) {
    console.error("❌ Profile fetch failed:", err.message);
    return null;
  } finally {
    await releaseLock(`ig:user:${igUserId}`);
  }
}

module.exports = {
  getCachedProfile,
  fetchAndCacheProfileSafely,
};
