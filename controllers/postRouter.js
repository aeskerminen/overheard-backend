const postRouter = require("express").Router();

var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const crypto = require("crypto");

const User = require("../models/User.js");
const Post = require("../models/Post.js");
const Vote = require("../models/Vote.js");
const Forum = require("../models/Forum.js");

postRouter.post("/", async (req, res) => {
  const { content, channel, color } = req.body;

  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const identifier = crypto.randomUUID();

  let post = new Post({ content, channel, color, identifier });
  let vote = new Vote({ votes: 0, post_identifier: identifier, voters: {} });
  let forum = new Forum({ userMap: {}, comments: [] });

  post.votes = vote;
  post.forum = forum;

  await vote.save();
  await forum.save();

  post
    .save()
    .then((result) => {
      console.log(result);
      return res
        .status(200)
        .json({ message: "Post succesfully created...", post });
    })
    .catch((err) => {
      return res.status(401).json({ error: "Failed to create post..." });
    });
});

postRouter.get("/", (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const createdAt = {
    $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString(),
  };

  Post.find({ createdAt }, {}, { sort: { createdAt: -1 } })
    .populate("votes")
    .populate("forum")
    .then((result) => {
      console.log(result);
      return res.json(result);
    })
    .catch((err) => {
      return res.status(405).json({ error: "Error finding posts..." });
    });
});

postRouter.post("/:id/comments", async (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  const body = req.body;
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  let post = await Post.findById(id);
  console.log("COMMENTING:", body);
});

postRouter.get("/:id/votes", (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  Vote.find({ post_identifier: id })
    .then((result) => {
      return res.json(result);
    })
    .catch((err) => {
      return res.status(404).json({ error: "Votes not found..." });
    });
});

postRouter.post("/:id/upvote", async (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  const vote = (await Vote.find({ post_identifier: id }).lean())[0];

  const ustring = `voters.${user.id}`;

  console.log("VOTE: ", vote);
  console.log("USER: ", user.id);

  if (vote.voters[user.id] !== "up" && vote.voters[user.id] !== "down") {
    Vote.findOneAndUpdate(
      { post_identifier: id },
      { $inc: { votes: 1 }, $set: { [`voters.${user.id}`]: "up" } }
    )
      .then((result) => {
        return res.status(200).end();
      })
      .catch((err) => {
        return res.status(404).json({ error: "Upvoting failed..." });
      });
  }
});

postRouter.post("/:id/unvote", async (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  const vote = (await Vote.find({ post_identifier: id }).lean())[0];

  const amount = vote.voters[user.id] === "up" ? -1 : 1;

  Vote.findOneAndUpdate(
    { post_identifier: id },
    { $inc: { votes: amount }, $unset: { [`voters.${user.id}`]: "" } }
  )
    .then((result) => {
      return res.status(200).end();
    })
    .catch((err) => {
      return res.status(404).json({ error: "Unvoting failed..." });
    });
});

postRouter.post("/:id/downvote", async (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  const vote = await (await Vote.find({ post_identifier: id }).lean())[0];

  const ustring = `voters.${user.id}`;

  if (vote.voters[user.id] !== "up" && vote.voters[user.id] !== "down") {
    Vote.findOneAndUpdate(
      { post_identifier: id },
      { $inc: { votes: -1 }, $set: { [`voters.${user.id}`]: "down" } }
    )
      .then((result) => {
        return res.status(200).end();
      })
      .catch((err) => {
        return res.status(404).json({ error: "Upvoting failed..." });
      });
  }
});

module.exports = postRouter;
