const express = require('express')
const router = express.Router()
const controller = require('../controllers/data.controller')

// delete DB data
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
// router.get('/candle', controller.candle)

router.get('/get-candle', controller.getcandle)

router.get('/get-header', controller.getheader)

router.get('/candle', controller.candle)


module.exports = router