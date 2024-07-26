const mongoose = require("mongoose");

const ForumSchema = new mongoose.Schema(
  {
    userMap: {
      type: Map,
      of: Number,
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    curNum: {
      type: Number,
      default: 1
    },
  },
  { timestamps: true }
);

const Forum = mongoose.model("Forum", ForumSchema);

module.exports = Forum;
