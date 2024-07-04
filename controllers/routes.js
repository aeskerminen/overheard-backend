const router = require('express').Router()

var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const User = require('../models/User.js')

router.get('/test', (req, res) => {
    return res.json("Hello, world!");
})

router.post("/register", async (req, res) => {
    const {email, pass} = req.body;
    const hashedPass = bcrypt.hash(pass, 10);

    const exists = await User.find({email})
    if(exists) {
        res.status(400).json({error: 'Email already in use...'})
    }

    const nUser = new User({email, password: hashedPass})
    nUser.save().then(result => {
        console.log(`User succesfully created: ${result}`)
        res.status(201).json({message: 'User registered succesfully...'})
    }).catch(err => {
        res.status(500).json({error: 'An error occurred when registering a new user...'})
    })
})

router.post("/login", async (req, res) => {
    const {email, pass} = req.body;
    
    const user = await User.find({email})
    if(!user) {
        res.status(401).json({error: 'Invalid user or password...'})
    }

    if(await bcrypt.compare(pass, user.password)) {
        let payload = {
            email: user.email,
            id: user._id
        }

        var token = jwt.sign(payload, process.env.SECRET, { algorithm: 'RS256', expiresIn: '1h' });

        res.cookie('token', token, {httpOnly: true}).status(200).json({message: 'Logged in succesfully...'})
    } else {
        res.status(401).json({error: 'Invalid user or password...'})
    }
})

module.exports = router