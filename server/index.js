import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import questionroute from "./routes/question.js";
import answerroutes from "./routes/answer.js";
import subscriptionroutes from "./routes/subscription.js";

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});

app.use("/user", userroutes);
app.use("/question", questionroute);
app.use("/answer", answerroutes);
app.use("/subscription", subscriptionroutes);

const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

if (!databaseurl || !process.env.JWT_SECRET) {
  throw new Error("MONGODB_URL and JWT_SECRET must be set in server/.env");
}

mongoose
  .connect(databaseurl, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(
      "Start MongoDB locally or replace MONGODB_URL with a reachable MongoDB Atlas connection string."
    );
    process.exitCode = 1;
  });
