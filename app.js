const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const config = require('./utils/config.js')

require('dotenv').config()

const app = express()
const router = require('./controllers/routes')

mongoose.set("strictQuery", false)
mongoose.connect(config.URL)

app.use(express.json())
app.use(cors())

app.use(morgan('tiny'))

app.use("/api", router)


module.exports = app