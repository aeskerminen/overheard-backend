const userRouter = require("express").Router();

var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const crypto = require("crypto");

const User = require("../models/User.js");
const Post = require("../models/Post.js");
const Vote = require("../models/Vote.js");

userRouter.post("/register", async (req, res) => {
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

userRouter.post("/login", async (req, res) => {
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

    var token = jwt.sign(payload, process.env.SECRET, { expiresIn: "24h" });

    return res
      .cookie("token", token, { httpOnly: true, sameSite: "strict" })
      .status(200)
      .json({ message: "Logged in succesfully...", id: payload.id });
  } else {
    return res.status(401).json({ error: "Invalid user or password..." });
  }
});

module.exports = userRouter