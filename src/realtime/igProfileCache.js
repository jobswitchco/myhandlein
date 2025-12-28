const { redisGet, redisSet } = require("./redisBridge");
const { acquireLock, releaseLock } = require("./redisLock");

const PROFILE_TTL = 3600; // 1 hour
const MAX_LOCK_WAIT = 5000; // 5 seconds

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
 * WRITE: Background only - WITH RETRY
 */
async function fetchAndCacheProfileSafely({
  igUserId,
  accessToken,
  conversationId,
  publishSocketEvent,
}) {
  const cacheKey = `ig:user:${igUserId}`;

  // 🔥 FIX #1: Check cache with timestamp validation
  const cached = await redisGet(cacheKey);
  if (cached?.fetchedAt) {
    const age = Date.now() - cached.fetchedAt;
    if (age < PROFILE_TTL * 1000) {
      console.log(`✅ Using cached profile for ${igUserId} (age: ${Math.floor(age / 1000)}s)`);
      return cached;
    }
    console.log(`⏰ Cached profile expired for ${igUserId}, refreshing...`);
  }

  // 🔥 FIX #2: Try to acquire lock, with timeout
  const lockKey = `lock:ig:user:${igUserId}`;
  const locked = await acquireLock(lockKey, 30);
  
  if (!locked) {
    console.log(`⏳ Lock busy for ${igUserId}, waiting for result...`);
    
    // Wait for the other process to finish and check cache again
    let attempts = 0;
    const maxAttempts = 10; // 5 seconds total
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const nowCached = await redisGet(cacheKey);
      if (nowCached?.fetchedAt && Date.now() - nowCached.fetchedAt < 10000) {
        console.log(`✅ Got fresh profile from other process for ${igUserId}`);
        return nowCached;
      }
      attempts++;
    }
    
    console.log(`⚠️ Timeout waiting for lock, returning stale cache for ${igUserId}`);
    return cached; // Return stale cache if available
  }

  try {
    console.log(`🔄 Fetching fresh profile for ${igUserId}...`);
    
    const InstagramService = await getInstagramService();

    const profile = await InstagramService.fetchUserProfile({
      igUserId,
      accessToken,
    });

    if (!profile) {
      console.log(`⚠️ No profile returned for ${igUserId}`);
      return null;
    }

    const payload = {
      igUserId,
      name: profile.name || null,
      profilePic: profile.profile_pic_url || null,
      restricted: profile.is_private || false,
      fetchedAt: Date.now(),
    };

    // 🔥 FIX #3: Ensure cache is set with proper TTL
    await redisSet(cacheKey, payload, PROFILE_TTL);
    console.log(`✅ Cached profile for ${igUserId} (TTL: ${PROFILE_TTL}s)`);

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
    console.error(`❌ Profile fetch failed for ${igUserId}:`, err.message);
    return cached || null; // Return stale cache on error
  } finally {
    await releaseLock(lockKey);
  }
}

module.exports = {
  getCachedProfile,
  fetchAndCacheProfileSafely,
};
