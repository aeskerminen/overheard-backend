const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    content: String,
    channel: String,
    color: String,
    identifier: String,
    votes: { type: mongoose.Schema.Types.ObjectId, ref: "Vote" },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
