const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

// router.get('/', controller.data)

// router.get('/insert', controller.insert)

router.get('/post', controller.get)

router.post('/post', controller.post)



router.get('/', controller.block)

router.post('/block', controller.blockpost)

//get all
router.get('/show', controller.show)

// get data
router.get('/preemptive', controller.preemptive)

router.get('/propose', controller.propose)

router.get('/absorption', controller.absorption)

router.get('/transfer', controller.transfer)

router.get('/slash', controller.slash)



module.exports = router