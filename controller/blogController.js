import Blog from "../models/blog.js";
import { catchAsync } from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

export const createBlog = catchAsync(async (req, res, next) => {
  const { title, content, category, tags, istrending, isRecent } = req.body;

  if (!req.file) {
    return next(new AppError("Image file is required", 400));
  }

  // 1. Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    folder: "sports-news",
  });

  // 2. Remove local file
  fs.unlinkSync(req.file.path);

  // 3. Save to DB
  const blog = await Blog.create({
    title,
    content,
    image: uploadResult.secure_url,
    category,
    tags: tags ? tags.split(",") : [],
    istrending: istrending === "true",
    isRecent: isRecent === "true",
    author: req.admin.id || "admin",
  });

  // 4. Respond
  return res.status(200).json({
    status: "success",
    data: blog,
  });
});

export const getAllBlog = catchAsync(async (req, res, next) => {
  const { category, istrending, isRecent, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (istrending) filter.istrending = istrending === "true";
  if (isRecent) filter.isRecent = isRecent === "true";

  const skip = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("author", "username avatar"),
    Blog.countDocuments(filter),
  ]);

  return res.status(200).json({
    status: "success",
    results: blogs.length,
    total,
    currentPage: Number(page),
    totalPages: Math.ceil(total / limit),
    data: blogs,
  });
});

export const getBlogBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug }).populate(
    "author",
    "username avatar"
  );

  if (!blog) {
    return next(new AppError("Blog not found", 400));
  }

  return res.status(200).json({
    status: "success",
    data: blog,
  });
});

export const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new AppError("Blog not found", 400));
  }

  // Extract public_id from the image URL
  const segments = blog.image.split("/");
  const publicId = `sports-news/${segments[segments.length - 1].split(".")[0]}`;

  // Delete image from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  // Delete blog from DB
  await Blog.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    status: "success",
    message: "Blog deleted successfully",
  });
});

export const getTrendingAndRecentPosts = catchAsync(async (req, res, next) => {
  // Get one trending post
  const trending = await Blog.findOne({ istrending: true })
    .sort({ createdAt: -1 }) // Most recent trending
    .populate("author", "username avatar");

  // Get 3 recent posts
  const recent = await Blog.find({ isRecent: true })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("author", "username avatar");

  return res.status(200).json({
    status: "success",
    data: {
      trending,
      recent,
    },
  });
});

export const getArticleStats = catchAsync(async (req, res, next) => {
  const stats = await Blog.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Optional: convert numeric month to string
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatted = stats.map((item) => ({
    month: monthNames[item._id],
    count: item.count,
  }));

  res.status(200).json(formatted);
});
