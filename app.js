// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongooseSanitizer from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import articleRouter from "./routes/articleRoute.js";
import authRouter from "./routes/authRoute.js";
import AppError from "./utils/appError.js";
import job from "./lib/cron.js";
import { globalErrorHandler } from "./controller/errorController.js";

const app = express();

job.start(); // Start the cron job to fetch sports news
// ✅ Tell Express to trust Render's proxy
app.set("trust proxy", 1);
app.use(cookieParser());
// Middlewares
// const allowedOrigins = [
//   process.env.CLIENT_URL_1,
//   process.env.CLIENT_URL_2,
//   process.env.TESTING_URL,
//   process.env.TESTING_URL2,
// ].filter(Boolean);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

app.use(
  cors({
    origin: process.env.CLIENT_URL_1, // your frontend domain
    credentials: true, // 👈 allow cookies
  })
);

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(express.json());
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongooseSanitizer());

// Data Sanitization against XSS
app.use(xss());

app.use(morgan("dev"));

// routes
app.use("/api/v1/article", articleRouter);
app.use("/api/v1/auth", authRouter);

// Routes placeholder
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Error handling middleware
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
