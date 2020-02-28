const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

router.get('/', controller.data)

// router.get('/insert', controller.insert)

router.get('/get', controller.get)

router.post('/get', controller.post)

router.get('/show', controller.show)

router.get('/block', controller.block)

router.post('/block', controller.blockpost)

// /insert?block=13
// {ghfhgjmh}

// /get/block=13
// {}

module.exports = router