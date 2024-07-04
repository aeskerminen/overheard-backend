const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const config = require('./utils/config.js')

require('dotenv').config()

const router = require('./controllers/routes')

mongoose.set("strictQuery", false)
mongoose.connect(config.URL)

app.use(express.json())
app.use(cors({origin: 'http://localhost:5173', credentials: true}))

app.use(morgan('tiny'))

app.use("/api", router)



module.exports = app