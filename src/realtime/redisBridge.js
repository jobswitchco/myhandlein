// services/redisBridge.js
const axios = require("axios");

// const REDIS_BRIDGE_URL = process.env.REDIS_BRIDGE_URL;
const REDIS_BRIDGE_URL = "http://34.180.49.15:3000";

const redisGet = async (key) => {
  const res = await axios.post(`${REDIS_BRIDGE_URL}/cache/get`, { key });
  return res.data?.value ? JSON.parse(res.data.value) : null;
};

const redisSet = async (key, value, ttl = 86400) => {
  await axios.post(`${REDIS_BRIDGE_URL}/cache/set`, {
    key,
    value,
    ttl,
  });
};

module.exports = {
  redisGet,
  redisSet,
};
