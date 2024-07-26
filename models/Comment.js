const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    content: String,
    userID: String,
    num: Number,
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
