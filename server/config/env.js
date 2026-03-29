const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

[
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env")
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
});

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: clientOrigins[0] || "http://localhost:5173",
  clientOrigins,
  devMemoryMode: (process.env.DEV_MEMORY_MODE || "auto").toLowerCase(),
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/seatsync",
  jwtSecret: process.env.JWT_SECRET || "replace-with-a-long-random-string",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  swapRequestExpiryMinutes: Number(process.env.SWAP_REQUEST_EXPIRY_MINUTES) || 15
};

module.exports = env;
