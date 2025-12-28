const axios = require("axios");
const REDIS_BRIDGE_URL = "http://34.180.49.15:3000";

const redisGet = async (key) => {
  const res = await axios.post(`${REDIS_BRIDGE_URL}/cache/get`, { key });
  // ✅ Bridge already parses, so just return it
  return res.data?.value || null;
};

const redisSet = async (key, value, ttl = 86400) => {
  // ✅ Send as-is, bridge will handle stringification
  await axios.post(`${REDIS_BRIDGE_URL}/cache/set`, {
    key,
    value,
    ttl,
  });
};

const redisDel = async (key) => {
  await axios.post(`${REDIS_BRIDGE_URL}/cache/del`, { key });
};

module.exports = {
  redisGet,
  redisSet,
  redisDel,
};
