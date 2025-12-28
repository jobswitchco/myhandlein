const { redisGet, redisSet, redisDel } = require("./redisBridge");
const { acquireLock, releaseLock } = require("./redisLock");

const PROFILE_TTL = 120; // 1 hour

async function getCachedProfile(igUserId) {
  if (!igUserId) return null;
  
  const cached = await redisGet(`ig:user:${igUserId}`);
  
  if (cached) {
    const age = cached.fetchedAt ? Date.now() - cached.fetchedAt : 0;
    console.log(`📦 Cache hit for ${igUserId} (age: ${Math.floor(age / 1000)}s)`);
  } else {
    console.log(`📦 Cache miss for ${igUserId}`);
  }
  
  return cached;
}

let InstagramService = null;

async function getInstagramService() {
  if (!InstagramService) {
    const mod = await import("../../backend/middleware/instagramService.js");
    InstagramService = mod.default || mod;
  }
  return InstagramService;
}

async function fetchAndCacheProfileSafely({
  igUserId,
  accessToken,
  conversationId,
  publishSocketEvent,
}) {
  const cacheKey = `ig:user:${igUserId}`;
  const lockKey = `lock:${cacheKey}`;

  // Fast path - check cache
  const cached = await getCachedProfile(igUserId);
  if (cached?.fetchedAt) {
    const age = Date.now() - cached.fetchedAt;
    if (age < PROFILE_TTL * 1000) {
      return cached;
    }
    console.log(`⏰ Profile expired for ${igUserId}, refreshing...`);
  }

  // Lock to prevent duplicate fetches
  const locked = await acquireLock(lockKey, 30);
  if (!locked) {
    console.log(`🔒 Failed to acquire lock for ${igUserId}, returning cached`);
    return cached;
  }

  try {
    console.log(`🔄 Fetching profile from Instagram for ${igUserId}...`);
    
    const InstagramService = await getInstagramService();

    const profile = await InstagramService.fetchUserProfile({
      igUserId,
      accessToken,
    });

    if (!profile) {
      console.log(`⚠️ No profile data returned for ${igUserId}`);
      return cached;
    }

    const payload = {
      igUserId,
      name: profile.name || null,
      profilePic: profile.profile_pic_url || null,
      restricted: profile.is_private || false,
      fetchedAt: Date.now(),
    };

    // 🔥 CRITICAL: Set cache with explicit logging
    console.log(`💾 Setting cache for ${igUserId}:`, {
      name: payload.name,
      hasPic: !!payload.profilePic,
      ttl: PROFILE_TTL,
    });

    console.log('payloadName : ', payload.name);
    console.log('profilePic : ', payload.profilePic);
    
    const setResult = await redisSet(cacheKey, payload, PROFILE_TTL);
    
    if (!setResult) {
      console.error(`❌ Failed to cache profile for ${igUserId}`);
    } else {
      console.log(`✅ Successfully cached profile for ${igUserId}`);
    }

    // Emit socket event
    if (conversationId && publishSocketEvent) {
     await publishSocketEvent({
  conversationId,
  payload: {
    type: "participant:updated",
    data: {
      igUserId,
      name: payload.name,
      profilePic: payload.profilePic,
    },
  },
});

      console.log(`📡 Emitted profile update for conversation ${conversationId}`);
    }

    return payload;
  } catch (err) {
    console.error(`❌ Profile fetch failed for ${igUserId}:`, err.message);
    return cached || null;
  } finally {
    await releaseLock(lockKey);
  }
}

module.exports = {
  getCachedProfile,
  fetchAndCacheProfileSafely,
};