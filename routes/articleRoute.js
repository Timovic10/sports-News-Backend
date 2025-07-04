import {
  createBlog,
  deleteBlog,
  getAllBlog,
  getBlogBySlug,
  getTrendingAndRecentPosts,
  getArticleStats,
} from "../sports-News-Backend/controller/blogController.js";
import { protect } from "../sports-News-Backend/controller/authController.js";
import upload from "../utils/upload.js";
import express from "express";

const router = express.Router();

router.post("/", protect, upload.single("image"), createBlog);
router.get("/", getAllBlog);
router.get("/getTrendingAndRecentPosts", getTrendingAndRecentPosts);
router.get("/stats", protect, getArticleStats); // Optional: protect route
router.get("/:slug", getBlogBySlug);
router.delete("/:id", protect, deleteBlog);

export default router;
