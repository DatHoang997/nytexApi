const url = require('url')
let Trade = require('../models/trade.model')
let Candle = require('../models/candle.model')
let Web3 = require('web3')
let SeigniorageABI = require('../JSON/Seigniorage.json')
let StableTokenABI = require('../JSON/StableToken.json')
let VolatileTokenABI = require('../JSON/VolatileToken.json')
let sha256 = require('js-sha256')
let current_new_block
const {weiToNTY, weiToMNTY, weiToNUSD, thousands, weiToPrice, nusdToWei, mntyToWei} = require('../util/help')

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ws.nexty.io'))
let seigniorageAddress = '0x0000000000000000000000000000000000023456'
let volatileTokenAddress = '0x0000000000000000000000000000000000034567'
let stableTokenAddress = '0x0000000000000000000000000000000000045678'
let burn = '0x0000000000000000000000000000000000000000'
let Seigniorage = new web3.eth.Contract(SeigniorageABI, seigniorageAddress)
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, volatileTokenAddress)
let StableToken = new web3.eth.Contract(StableTokenABI, stableTokenAddress)

module.exports.gettoptrade = async function (req, res) {
  let show = await Trade.find({status: 'order'}).limit(40).sort({blockNumber: -1})
  res.json(show)
}

module.exports.alltrade = async function (req, res) {
  let show = await Trade.find().sort({blockNumber: -1})
  res.json(show)
}

module.exports.getopenorder = async function (req, res) {
  const queryObject = url.parse(req.url, true).query
  let address = queryObject.address
  let from = parseInt(queryObject.from)
  let to = parseInt(queryObject.to)
  let show = await Trade.find({$or: [{status: 'order'}, {status: 'filling'}],address: address,time: {$gte: from, $lte: to}}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.getopenhistory = async function (req, res) {
  const queryObject = url.parse(req.url, true).query
  let address = queryObject.address
  let from = parseInt(queryObject.from)
  let to = parseInt(queryObject.to)
  let show = await Trade.find({$or: [{status: 'canceled'}, {status: 'filled'}, {status: 'order'}],address: address,time: {$gte: from, $lte: to}}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.gettradehistory = async function (req, res) {
  const queryObject = url.parse(req.url, true).query
  let address = queryObject.address
  let from = parseInt(queryObject.from)
  let to = parseInt(queryObject.to)
  let show = await Trade.find({$or: [{status: 'filling'}, {status: 'filled'}],address: address,time: {$gte: from, $lte: to}}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.getlastestfill = async function (req, res) {
  let show = await Trade.find({status: 'filled'}).limit(1).sort({filledTime: -1})
  res.json(show[0].price)
}

module.exports.getcandle = async function (req, res) {
  const queryObject = url.parse(req.url, true).query
  let type = queryObject.type
  let result = []
  switch (type) {
    default : {
      let show = await Candle.find({}).sort({time: 1})
      res.json(show)
      break;
    }
    case '15m': {
      let show = await Candle.find({}).sort({time: 1})
      res.json(show)
      break;
    }
    case '30m': {
      // 15 day
      Candle.find({}).limit(14400).sort({time: -1}).exec(function (err, doc) {
        let num = doc.length
        if (err) console.log(err)
        for (i = num-1; i >=0; i-=2) {
          let array = []
          let MNTY = 0
          let NewSD = 0
          for (j = i; j > i-2; j--) {
            array.push(doc[j].high, doc[j].low)
            MNTY = MNTY + doc[j].volumeMNTY
            NewSD = NewSD + doc[j].volumeNewSD
          }
            let data = {
              high : Math.max.apply(Math, array),
              low : Math.min.apply(Math, array),
              open : doc[j+2].open,
              close : doc[j+1].close,
              volumeMNTY: MNTY,
              volumeNewSD: NewSD,
              time: doc[j+2].time,
            }
            result.push(data)
          if(j<=-1){
            let show = result
            res.json(show)
          }
        }
      })
      break;
    }
    case '1h': {
      // 30 day
      Candle.find({}).limit(14400).sort({time: -1}).exec(function (err, doc) {
        let num = doc.length
        if (err) console.log(err)
        for (i = num-1; i >=0; i-=4) {
          let array = []
          let MNTY = 0
          let NewSD = 0
          for (j = i; j > i-4; j--) {
            array.push(doc[j].high, doc[j].low)
            MNTY = MNTY + doc[j].volumeMNTY
            NewSD = NewSD+ doc[j].volumeNewSD
          }
          console.log(j)
          let data = {
            high : Math.max.apply(Math, array),
            low : Math.min.apply(Math, array),
            open : doc[j+4].open,
            close : doc[j+1].close,
            volumeMNTY: MNTY,
            volumeNewSD: NewSD,
            time: doc[j+4].time,
          }
          result.push(data)
          if(j<=-1){
            let show = result
            res.json(show)
          }
        }
      })
      break;
    }
    case '1d': {
      Candle.find({}).sort({time:1}).exec(function (err, doc) {
        let num = doc.length
        if (err) console.log(err)
        if (num%96==0) {
          for (i = 0; i < num; i+=96) {
            let array = []
            let MNTY = 0
            let NewSD = 0
            for (j = i; j <= i+95; j++) {
              array.push(doc[j].high, doc[j].low)
             MNTY = MNTY + doc[j].volumeMNTY
             NewSD = NewSD + doc[j].volumeNewSD
            }
            let data = {
              high : Math.max.apply(Math, array),
              low : Math.min.apply(Math, array),
              open : doc[j-96].open,
              close : doc[j-1].close,
              volumeMNTY: MNTY,
              volumeNewSD: NewSD,
              time: doc[j-96].time,
            }
            result.push(data)
            if (i+96 >= num) {
              let show = result
              res.json(show)
            }
          }
        } else {
          if (num > 96) {
            for (i = 0; i < num-96; i+=96) {
              let array = []
              let MNTY = 0
              let NewSD = 0
              for (j = i; j <= i+95; j++) {
                array.push(doc[j].high, doc[j].low)
               MNTY = MNTY + doc[j].volumeMNTY
               NewSD = NewSD + doc[j].volumeNewSD
              }
              let data = {
                high : Math.max.apply(Math, array),
                low : Math.min.apply(Math, array),
                open : doc[j-96].open,
                close : doc[j-1].close,
                volumeMNTY: MNTY,
                volumeNewSD: NewSD,
                time: doc[j-96].time,
              }
              result.push(data)
              if (num-1-i<=190) {
                let arr = []
                for (let k = j; k<num-1; k++) {
                  arr.push(doc[k].high, doc[k].low)
                 MNTY = MNTY + doc[k].volumeMNTY
                 NewSD = NewSD + doc[k].volumeNewSD
                }
                let data = {
                  high : Math.max.apply(Math, arr),
                  low : Math.min.apply(Math, arr),
                  open : doc[j].open,
                  close : doc[num-1].close,
                  volumeMNTY: MNTY,
                  volumeNewSD: NewSD,
                  time: doc[j].time,
                }
                result.push(data)
                let show = result
                res.json(show)
              }
            }
          } else {
            console.log('wait for a few seconds')
            res.send('wait for a few seconds')
          }
        }
      })
    }
  }
}

module.exports.getheader = function (req, res) {
  let array = []
  let MNTY = 0
  let NewSD = 0
  let time_now = parseInt(Date.now().toString().slice(0,-3))
  Trade.findOne({status: 'filled'}).sort({filledTime: -1}).exec(function (err, doc) {
    if (err) console.log(err)
    price = doc.price
    if(time_now-86399 < doc.filledTime && doc.filledTime < time_now+1) {
      Trade.find({status: 'filled', filledTime: {$gte: time_now-86400, $lte: time_now}}).sort({filledTime: 1}).exec(function (err, doc1) {
        if (err) console.log(err)
        Trade.findOne({status: 'filled', filledTime: {$lte: time_now-86400}}).sort({filledTime: -1}).exec(function (err, doc2) {
          if (err) console.log(err)
          for (let i = 0; i< doc1.length; i++) {
            if (doc1[i].to == volatileTokenAddress) {
             MNTY = MNTY + parseFloat(doc1[i].haveAmount.slice(0,-5))
             NewSD = NewSD + parseFloat(doc1[i].wantAmount.slice(0,-6))
            } else {
             MNTY = MNTY + parseFloat(doc1[i].wantAmount.slice(0,-5))
             NewSD = NewSD + parseFloat(doc1[i].haveAmount.slice(0,-6))
            }
            array.push(doc1[i].price)
          }
          let persent = (price - doc2.price)/doc2.price*100
          if (price - doc2.price >= 0)
          {
            let printPersent = '+' + persent + '%'
            let data = {
              high : Math.max.apply(Math, array),
              low : Math.min.apply(Math, array),
              open : doc2.price,
              filled : price,
              volumeMNTY: MNTY,
              volumeNewSD: NewSD,
              change: price-doc2.price,
              percent: printPersent,
            }
            let show = data
            res.json(show)
          } else {
            let printPersent = '-' + persent + '%'
            let data = {
              high : Math.max.apply(Math, array),
              low : Math.min.apply(Math, array),
              open : doc2.price,
              filled : price,
              volumeMNTY: MNTY,
              volumeNewSD: NewSD,
              change: price-doc2.price,
              percent: printPersent,
            }
            let show = data
            res.json(show)
          }
        })
      })
    } else {
      let data = {
        high : price,
        low : price,
        open : price,
        filled : price,
        volumeMNTY: 0,
        volumeNewSD: 0,
        change: 0,
        percent: 0 + '%',
      }
      let show = data
      res.json(show)
    }
  })
}

module.exports.tradeclear = async function (req, res) {
  Trade.deleteMany({}, function (err, res) {if (err) console.log(err)})
  res.send('da xoa DB')
}

module.exports.candleclear = async function (req, res) {
  Candle.deleteMany({}, function (err, res) {if (err) console.log(err)})
  res.send('da xoa DB')
}

module.exports.filled = async function (req, res) {
  let show = await Trade.find({status: 'filled'}).sort({filledTime: -1})
  res.json(show)
}

module.exports.candle = async function (req, res) {  
  function createFirstCandle(begin) {
    end = begin + 900
    Trade.find({status: 'filled', filledTime: {$gte: begin, $lt: end}}).exec(function (err, doc) {
      if (err) console.log(err)
      let array = []
      let MNTY = 0
      let NewSD = 0
      for (let i = 0; i < doc.length; i++)
      {
        array.push(parseFloat(doc[i].price.replace(',','')))
        if (doc[i].to == volatileTokenAddress) {
          MNTY = MNTY + parseFloat(doc[i].haveAmount.slice(0,-5))
          NewSD = NewSD + parseFloat(doc[i].wantAmount.slice(0,-6))
        }
        if (MNTY==0 && doc[i].to == stableTokenAddress) {
          MNTY = MNTY + parseFloat(doc[i].wantAmount.slice(0,-5))
          NewSD = NewSD + parseFloat(doc[i].haveAmount.slice(0,-6))
        }
      }
      Candle.create({
        open: doc[0].price,
        high: Math.max.apply(Math, array),
        low: Math.min.apply(Math, array),
        close: parseFloat(doc[doc.length-1].price.toString().replace(',','')),
        volumeMNTY: MNTY,
        volumeNewSD: NewSD,
        time: end
      }, function (err) {
        if (err) console.log(err)
        Trade.findOne().sort({time: -1}).exec(function (err, doc) {
          if (err) console.log(err)
          if (end + 900 < doc.time) createCandle(end)
          else {
            let wait = (end + 900 - doc.time  + 5)*1000
            setTimeout(function() {createCandle(end)}, wait)
          }
        })
      })
    })
  }
  
  function createCandle(begin) {
    end = begin + 900
    let time_now = parseInt(Date.now().toString().slice(0,-3))
    Trade.find({status: 'filled', filledTime: {$gte: begin, $lte: end}}).sort({filledTime: -1}).exec(function (err, doc) {
      if (err) console.log(err)
      if (doc[0] != null || doc[0] != undefined) {
        Candle.findOne().sort({time: -1}).exec(function (err, doc1) {
          if (err) console.log(err)
          let array = []
          let MNTY = 0
          let NewSD = 0
          for (let i = 0; i < doc.length; i++)
          {
            array.push(parseFloat(doc[i].price.replace(',','')))
            if (doc[i].to == volatileTokenAddress) {
              MNTY = MNTY + parseFloat(doc[i].haveAmount.slice(0,-5))
              NewSD = NewSD + parseFloat(doc[i].wantAmount.slice(0,-6))
            }
            if (MNTY==0 && doc[i].to == stableTokenAddress) {
              MNTY = MNTY + parseFloat(doc[i].wantAmount.slice(0,-5))
              NewSD = NewSD + parseFloat(doc[i].haveAmount.slice(0,-6))
            }
          }
          Candle.create({
            open: doc1.close,
            high: Math.max.apply(Math, array),
            low: Math.min.apply(Math, array),
            close: parseFloat(doc[0].price.toString().replace(',','')),
            volumeMNTY: MNTY,
            volumeNewSD: NewSD,
            time: end
          }, function (err) {
            if (err) console.log(err)
            if (end + 900 < time_now) createCandle(end)
            else {
              let wait = (end + 900 - time_now + 5)*1000
              console.log('wait first',wait)
              setTimeout(function() {createCandle(end)}, wait)
            }
          })
        })
      } else {
        Candle.findOne().sort({time: -1}).exec(function (err, doc) {
          if (err) console.log(err)
          Candle.create({
            open: doc.close,
            high: doc.close,
            low: doc.close,
            close: parseFloat(doc.close.toString().replace(',','')),
            volumeMNTY: 0,
            volumeNewSD: 0,
            time: end
          }, function (err) {
            if (err) console.log(err)
            if (end + 900 < time_now) {
              createCandle(end)
            } else {
              let wait = (end + 900 - time_now + 5)*1000
              console.log('wait2',wait)
              setTimeout(function() {createCandle(end)}, wait)
            }
          })
        })
      }
    })
  }

  console.log('start')
  Candle.findOne().sort({filledTime: -1}).exec(function (err, doc) {
    if (err) console.log(err)
    if(doc == null) {
      Trade.findOne({status: 'filled'}).sort({filledTime: 1}).exec(function (err, doc1) {
        if (err) console.log(err)
        if (doc1 != null ) {
          createFirstCandle(doc1.filledTime) // first point
        } else setTimeout(function(){createFirstCandle(doc1.filledTime)},5000)
      })
    } else {
      Candle.findOne({}).sort({time: -1}).exec(function (err, doc) {
        if (err) console.log(err)
        createCandle(doc.time)
      })
    }
  })
}
