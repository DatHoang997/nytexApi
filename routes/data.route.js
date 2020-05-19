const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

// insert data
router.get('/', controller.block)

// router.get('/trade', controller.trade)

// get all event
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

router.get('/tradeclear', controller.tradeclear)

router.get('/candleclear', controller.candleclear)

//trade
router.get('/alltrade', controller.alltrade)

router.get('/gettoptrade', controller.gettoptrade)

router.get('/get-open-history', controller.getopenhistory)

router.get('/get-trade-history', controller.gettradehistory)

router.get('/get-open-order', controller.getopenorder)

router.get('/get-lastest-fill', controller.getlastestfill)

router.get('/filled', controller.filled)

//Candle
router.get('/candle', controller.candle)

router.get('/get-candle', controller.getcandle)

router.get('/get-header', controller.getheader)

router.get('/a', controller.a)


module.exports = router