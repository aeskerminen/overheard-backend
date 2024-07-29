const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    content: String,
    channel: String,
    color: String,
    identifier: String,
    location: String,
    votes: { type: mongoose.Schema.Types.ObjectId, ref: "Vote" },
    forum: {type: mongoose.Schema.Types.ObjectId, ref: "Forum"}
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
