const router = require('express').Router()

var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

router.get('/test', (req, res) => {
    return res.json("Hello, world!");
})

router.post("/register", (req, res) => {
    const {email, pass} = req.body;
    const hashedPass = bcrypt.hash(pass, 10);
})

module.exports = router