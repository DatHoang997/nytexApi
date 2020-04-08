const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

// insert data


router.get('/trade', controller.trade)

// get all



module.exports = router