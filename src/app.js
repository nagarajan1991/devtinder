const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { generalLimiter } = require("./middlewares/rateLimiter");

require("dotenv").config();

require("./utils/cronjob");

// Trust proxy for production deployment behind Nginx
// Only trust the first proxy (Nginx) to prevent IP spoofing
app.set('trust proxy', 1);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://nagadev.co.uk"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Apply general rate limiting to all API routes
app.use("/api", generalLimiter);

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const premiumRouter = require("./routes/premium");
const { initializeSocket } = require("./utils/socket");
const chatRouter = require("./routes/chat");

app.use("/api/auth", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", userRouter);
app.use("/api", paymentRouter);
app.use("/api", premiumRouter);
app.use("/api", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      // Server started successfully
    });
  })
  .catch((err) => {
    // Database connection failed
  });