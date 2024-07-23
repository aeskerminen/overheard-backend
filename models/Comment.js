const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    content: String, 
    userID: String,
  },
  { timestamps: true }
);

const Vote = mongoose.model("Vote", VoteSchema);

module.exports = Vote;
