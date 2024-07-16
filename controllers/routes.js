const router = require("express").Router();

var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const crypto = require("crypto");

const User = require("../models/User.js");
const Post = require("../models/Post.js");
const Vote = require("../models/Vote.js");

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);

  const exists = await User.find({ email })[0];
  if (exists) {
    return res.status(400).json({ error: "Email already in use..." });
  }

  const nUser = new User({ email, password: hashedPass });
  nUser
    .save()
    .then((result) => {
      console.log(`User succesfully created: ${result}`);
      return res
        .status(201)
        .json({ message: "User registered succesfully..." });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ error: "An error occurred when registering a new user..." });
    });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.find({ email });
  if (!user[0]) {
    return res.status(401).json({ error: "Invalid user or password..." });
  }

  if (await bcrypt.compare(password, user[0].password)) {
    let payload = {
      email: user[0].email,
      id: user[0]._id.toJSON(),
    };

    var token = jwt.sign(payload, process.env.SECRET, { expiresIn: "1h" });

    return res
      .cookie("token", token, { httpOnly: true, sameSite: "strict" })
      .status(200)
      .json({ message: "Logged in succesfully..." });
  } else {
    return res.status(401).json({ error: "Invalid user or password..." });
  }
});

router.post("/post", (req, res) => {
  const { content, channel, color } = req.body;

  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const identifier = crypto.randomUUID();

  let post = new Post({ content, channel, color, identifier });
  let vote = new Vote({ votes: 0, post_identifier: identifier, voters: {} });

  vote.save().then((result) => {});

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

router.get("/posts", (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const createdAt = {
    $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    $lte: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString(),
  };

  Post.find({ createdAt }, {}, { sort: { createdAt: -1 } })
    .then((result) => {
      console.log(result);
      return res.json(result);
    })
    .catch((err) => {
      return res.status(405).json({ error: "Error finding posts..." });
    });
});

router.get("/posts/:id/votes", (req, res) => {
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

router.post("/posts/:id/upvote", async (req, res) => {
  const user = jwt.verify(req.cookies.token, process.env.SECRET);
  if (user === undefined) {
    return res.status(405).json({ error: "Unauthorized user..." });
  }

  const id = req.params.id;

  const vote = (await Vote.find({ post_identifier: id }).lean())[0];

  console.log(vote.voters);
  console.log(user.id);
  console.log(vote.voters[user.id]);

  const ustring = `voters.${user.id}`;

  if (vote.voters[user.id] !== "up" && vote.voters[user.id] !== "down") {
    Vote.findOneAndUpdate(
      { post_identifier: id },
      { $inc: { votes: 1 }, $set: { ustring: "up" } }
    )
      .then((result) => {
        return res.status(200).end();
      })
      .catch((err) => {
        return res.status(404).json({ error: "Upvoting failed..." });
      });
  }
});

router.post("/posts/:id/downvote", async (req, res) => {
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
      { $inc: { votes: -1 }, $set: { ustring: "down" } }
    )
      .then((result) => {
        return res.status(200).end();
      })
      .catch((err) => {
        return res.status(404).json({ error: "Upvoting failed..." });
      });
  }
});

module.exports = router;
