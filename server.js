const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// CORS — allow frontend origin from env (no wildcard + credentials)
const allowedOrigins = process.env.ALLOWED_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      // temporary: allow all during initial deployment
      if (allowedOrigins === "*") return callback(null, true);
      if (!origin) return callback(null, true);
      const list = allowedOrigins.split(",").map((o) => o.trim());
      if (list.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/colleges", require("./routes/colleges"));
app.use("/api/predictor", require("./routes/predictor"));

// Health check — Render pings this to confirm the service is up
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "College Discovery API is running",
    env: process.env.NODE_ENV,
  });
});

// Error handler
app.use(require("./middleware/errorHandler"));

// MongoDB + server startup
const PORT = process.env.PORT || 8000; // Render injects PORT automatically
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/college_discovery";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, "0.0.0.0", () => {
      // "0.0.0.0" is required on Render — localhost alone won't bind correctly
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });