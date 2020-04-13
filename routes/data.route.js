const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

// insert data
router.get('/', controller.block)

router.get('/trade', controller.trade)

// get all
router.get('/show', controller.show)

// get data
router.get('/preemptive', controller.preemptive)

router.get('/propose', controller.propose)

router.get('/absorption', controller.absorption)

router.get('/transfer', controller.transfer)

router.get('/slash', controller.slash)

router.get('/approval', controller.approval)

// delete DB data
router.get('/clear', controller.clear)

//trade
router.get('/gettoptrade', controller.gettoptrade) //40 last order

router.get('/gettrade', controller.gettrade) // all order

router.get('/getcanceledtrade', controller.getcanceledtrade) // canceled order

router.get('/getfillingtrade', controller.getfillingtrade) //filling order

router.get('/getfilledtrade', controller.getfilledtrade) // filled order


module.exports = router