import mongoose from "mongoose";
import slugify from "slugify";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A blog must have a title"],
      trim: true,
    },
    slug: { type: String, unique: true },
    image: String, // URL
    content: { type: String },
    paragraphs: [String], // Array of paragraphs
    category: {
      type: String,
      enum: ["Football", "Basketball", "NFL", "Tennis", "Cycling", "Other"],
      default: "Football",
    },
    tags: [String],
    // 🔗 Author is linked to User model
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    istrending: { type: Boolean, default: false },
    isRecent: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
articleSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.content) {
    this.paragraphs = this.content
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s + ".");
  }

  next();
});

const Article = mongoose.model("Article", articleSchema);
export default Article;

// ✨ Pre-save middleware
