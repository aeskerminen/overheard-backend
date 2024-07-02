const router = require('express').Router()

router.get('/test', (req, res) => {
    return res.json("Hello, world!");
})

module.exports = router