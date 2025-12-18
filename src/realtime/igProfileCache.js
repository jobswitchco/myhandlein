// services/igProfileCache.js
const axios = require("axios");
const { redisGet, redisSet } = require("./redisBridge.js");

const CACHE_TTL = 60 * 60 * 24; // 24 hours

const warmIgProfile = async ({
  igUserId,
  username,
  accessToken
}) => {
  const cacheKey = `ig:user:${igUserId}`;

  // 1️⃣ If cached (even restricted), never retry
  const existing = await redisGet(cacheKey);
  if (existing) return;

  try {
    const res = await axios.get(
      `https://graph.facebook.com/v24.0/${igUserId}`,
      {
        params: {
          fields: [
            "username",
            "name",
            "profile_pic",
            "follower_count",
            "is_user_follow_business",
            "is_business_follow_user"
          ].join(","),
          access_token: accessToken
        },
        timeout: 5000
      }
    );

    const profile = {
      igUserId,
      username: res.data.username || username,
      name: res.data.name || null,
      profilePic: res.data.profile_pic || null,

      // optional metadata
      followerCount: res.data.follower_count || null,
      followsBusiness: !!res.data.is_user_follow_business,
      followedByBusiness: !!res.data.is_business_follow_user,

      // bookkeeping
      restricted: false,
      fetchedAt: Date.now()
    };

    await redisSet(cacheKey, profile, CACHE_TTL);
    return;

  } catch (err) {
    const fbError = err.response?.data?.error;

    // 🟡 CASE 1: User explicitly restricted profile access
    if (fbError?.code === 230) {
      await redisSet(
        cacheKey,
        {
          igUserId,
          username,
          name: null,
          profilePic: null,
          restricted: true,
          reason: "consent_required",
          fetchedAt: Date.now()
        },
        CACHE_TTL
      );
      return;
    }

    // 🟡 CASE 2: Field not accessible for this node
    if (fbError?.code === 100) {
      await redisSet(
        cacheKey,
        {
          igUserId,
          username,
          name: null,
          profilePic: null,
          restricted: true,
          reason: "field_not_allowed",
          fetchedAt: Date.now()
        },
        CACHE_TTL
      );
      return;
    }

    // 🔴 CASE 3: Real failure (network / rate limit / Meta outage)
    console.error(
      "IG profile fetch hard failure:",
      igUserId,
      fbError || err.message
    );
  }
};

module.exports = {
  warmIgProfile,
};
