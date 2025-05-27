const Redis = require("ioredis");

const client = new Redis("rediss://default:AVM7AAIjcDFlMGNmNTdlN2E1YWQ0NDAzYTZkNTAyOGRjMWNhZTEwMnAxMA@moving-akita-21307.upstash.io:6379");

(async () => {
  await client.set("foo", "bar");
  const value = await client.get("foo");
  console.log("Redis value:", value);
})();

