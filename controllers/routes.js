const router = require('express').Router()

var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const crypto = require('crypto')

const User = require('../models/User.js');
const Post = require('../models/Post.js');

router.post("/register", async (req, res) => {
    const {email, password} = req.body;
    const hashedPass = await bcrypt.hash(password, 10);

    const exists = await User.find({email})[0]
    if(exists) {
        return res.status(400).json({error: 'Email already in use...'})
    }

    const nUser = new User({email, password: hashedPass})
    nUser.save().then(result => {
        console.log(`User succesfully created: ${result}`)
        return res.status(201).json({message: 'User registered succesfully...'})
    }).catch(err => {
        console.log(err)
        return res.status(500).json({error: 'An error occurred when registering a new user...'})
    })
})

router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    
    const user = await User.find({email})
    if(!user[0]) {
        return res.status(401).json({error: 'Invalid user or password...'})
    }

    if(await bcrypt.compare(password, user[0].password)) {
        let payload = {
            email: user.email,
            id: user._id
        }

        var token = jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' });

        return res.cookie('token', token, {httpOnly: true, sameSite: 'strict'}).status(200).json({message: 'Logged in succesfully...'})
    } else {
        return res.status(401).json({error: 'Invalid user or password...'})
    }
})

router.post("/post", (req, res) => {
    const {content} = req.body;

    const user = jwt.verify(req.cookies.token, process.env.SECRET)
    if(user === undefined) {
        return res.status(405).json({error: 'Unauthorized user...'})
    }

    let post = new Post({content, identifier: crypto.randomUUID()})
    post.save().then(result => {
        console.log(result)
        return res.status(200).json({message: 'Post succesfully created...'})
    }).catch(err => {
        return res.status(401).json({error: 'Failed to create post...'})
    })
})

router.get("/posts", (req, res) => {
    const user = jwt.verify(req.cookies.token, process.env.SECRET)
    if(user === undefined) {
        return res.status(405).json({error: 'Unauthorized user...'})
    }

    Post.find({}).then(result => {
        console.log(result)
        return res.json(result)
    }).catch(err => {
        return res.status(405).json({error: 'Error finding posts...'})
    });
})

module.exports = router