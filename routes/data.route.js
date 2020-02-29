const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

router.get('/', controller.data)

// router.get('/insert', controller.insert)

router.get('/post', controller.get)

router.post('/post', controller.post)

router.get('/show', controller.show)

router.get('/block', controller.block)

router.post('/block', controller.blockpost)

// /insert?block=13
// {ghfhgjmh}

// /get/block=13
// {}

module.exports = router