const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, default: "tips" },
  tags: [String],
  views: { type: Number, default: 0 },
  likes: [
    {
      userId: String,
      userName: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  likesCount: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 좋아요 수 자동 계산
postSchema.pre("save", function (next) {
  this.likesCount = this.likes ? this.likes.length : 0;
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Post", postSchema);
