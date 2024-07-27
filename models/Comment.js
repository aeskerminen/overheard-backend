const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    content: String,
    userID: String,
    num: Number,
    votes: { type: mongoose.Schema.Types.ObjectId, ref: "Vote" },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;
