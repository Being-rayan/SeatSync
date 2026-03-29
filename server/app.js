const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const journeysRoutes = require("./routes/journeysRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const swapRoutes = require("./routes/swapRoutes");

const app = express();
const localDevOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/;
const allowedOrigins = new Set(env.clientOrigins);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  return env.nodeEnv !== "production" && localDevOriginPattern.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: false
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/journeys", journeysRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
