import Redis from "ioredis";

const options = {
  host: '10.188.103.27',
  port: 6379,
  maxRetriesPerRequest: null,
};

export const redisPub = new Redis(options);
export const redisSub = new Redis(options);
