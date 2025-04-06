import express, { urlencoded } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dbConnection from "./database/dbConnection.js";
import { errorMiddleware } from "./middleware/error.js";
import messageRouter from "./router/messageRoutes.js";
import userRouter from "./router/userRoutes.js";
import timelineRouter from "./router/timelineRoutes.js";
import applicationRouter from "./router/softwareApplicationRoutes.js";
import skillRouter from "./router/skillRoutes.js";
import projectRouter from "./router/projectRoutes.js";

const app = express();
dotenv.config({ path: "./config/config.env" });

// Enable CORS with specific origins
app.use(
  cors({
    origin: [process.env.PORTFOLIO_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Middleware for parsing cookies, JSON, and URL-encoded data
app.use(cookieParser());
app.use(express.json());
app.use(urlencoded({ extended: true }));

// Enable file upload functionality
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Define API routes
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/timeline", timelineRouter);
app.use("/api/v1/softwareapplication", applicationRouter);
app.use("/api/v1/skill", skillRouter);
app.use("/api/v1/project", projectRouter);

// Connect to the database
dbConnection();

// Global error handling middleware
app.use(errorMiddleware);

export default app;
