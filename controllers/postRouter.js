const postRouter = require("express").Router();

var jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Post = require("../models/Post.js");
const Vote = require("../models/Vote.js");
const Forum = require("../models/Forum.js");
const Comment = require("../models/Comment.js");

postRouter.post("/", async (req, res) => {
  const { content, channel, color, location } = req.body;

  console.log("LOCAT: ", location);

  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const identifier = crypto.randomUUID();

  let post = new Post({ content, channel, color, identifier, location });
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

  const location = req.query.location;

  const createdAt = {
    $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString(),
  };

  Post.find(
    { createdAt, location },
    {},
    {
      sort: { createdAt: -1 },
      select: "identifier channel color content location forum votes createdAt",
    }
  )
    .populate([{ path: "votes", select: "voters votes" }])
    .populate([
      {
        path: "forum",
        select: "comments",
        populate: [
          {
            path: "comments",
            select: "content num userID createdAt _id",
            populate: [{ path: "votes" }],
          },
        ],
      },
    ])
    .lean()
    .then((result) => {
      result.forEach((r) => {
        r.forum.comments.forEach((c) => {
          c.own = c.userID === user.id ? true : false;
          delete c.userID;
        });
      });
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
  await post.populate("forum");

  let fr = await Forum.findById(post.forum._id).lean();
  const m = fr.userMap;

  let userNum;
  if (m[user.id] === undefined) {
    await Forum.findByIdAndUpdate(post.forum._id, {
      $set: { [`userMap.${user.id}`]: post.forum.curNum },
      $inc: { curNum: 1 },
    });
    userNum = post.forum.curNum;
  } else {
    userNum = m[user.id];
  }

  let comment = new Comment({
    content: body.content,
    num: userNum,
    userID: user.id,
  });

  let vote = new Vote({ votes: 0, post_identifier: comment._id, voters: {} });
  comment.votes = vote;

  await vote.save();

  post.forum.comments.push(comment);

  await comment.save();
  await post.forum.save();
  await post.save();
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
