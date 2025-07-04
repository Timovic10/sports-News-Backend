import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import Admin from "./models/admin.js";

dotenv.config();
// {
//   "username": "ksoft",
//   "password": "123456789"
// }
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Drop the old incorrect index
    await Admin.collection.dropIndex("userName_1").catch((err) => {
      if (err.codeName !== "IndexNotFound") {
        console.error("❌ Failed to drop index:", err.message);
      } else {
        console.log("ℹ️ Index userName_1 not found, skipping.");
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

startServer();
