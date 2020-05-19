const express = require('express')
const app = express()
const port = 8881
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dataRoute = require('./routes/data.route')
var cors = require('cors');
let Data = require('./models/data.model')
let Trade = require('./models/trade.model')
let Candle = require('./models/candle.model')
let Web3 = require('web3')
let SeigniorageABI = require('./JSON/Seigniorage.json')
let StableTokenABI = require('./JSON/StableToken.json')
let VolatileTokenABI = require('./JSON/VolatileToken.json')
let sha256 = require('js-sha256')
let current_new_block
const {weiToNTY, weiToMNTY, weiToNUSD, thousands, weiToPrice, nusdToWei, mntyToWei} = require('./util/help')

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ws.nexty.io'))
let seigniorageAddress = '0x0000000000000000000000000000000000023456'
let volatileTokenAddress = '0x0000000000000000000000000000000000034567'
let stableTokenAddress = '0x0000000000000000000000000000000000045678'
let burn = '0x0000000000000000000000000000000000000000'
let Seigniorage = new web3.eth.Contract(SeigniorageABI, seigniorageAddress)
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, volatileTokenAddress)
let StableToken = new web3.eth.Contract(StableTokenABI, stableTokenAddress)

mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded

app.use('/', dataRoute)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

let scanning_old_blocks = 1
let array = []
console.log('start!!')

let cursor = 33068795 //28588000   //33068795 //33118783
  function scanBlock(i) {
  // console.log(i)
  Trade.create({status: 'false', number: i}, function (err) {
    if (err) console.log(err)
  })
  web3.eth.getBlock(i, true, function (err, result) { //31945638
    if (err) console.log(err)
    if (result.transactions != null) {
      result.transactions.forEach(function (e) {
        let id = e.input.slice(2, 10)
        let para = '0x' + e.input.slice(10)
        if (id == "43271d79") { //cancel(bool, ID bytes32)
          let decode = web3.eth.abi.decodeParameters(['bool', 'bytes32'], para)
          setTimeout(function(){
            Trade.findOneAndUpdate({orderID: decode["1"]}, {$set: {status: 'canceled'}}, {useFindAndModify: false}, function (err, doc) {})
          },1000)
        } else if (id === "7ca3c7c7" && e.to == volatileTokenAddress) { //SELL depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" ||
          let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
          const packed = e.from.substring(2) + decode["0"].substring(2)
          console.log('SELLLLLLLLLLLLLLLLLLL')
          Trade.create({
            status: 'order',
            address: e.from,
            to: e.to,
            haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
            wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
            price: thousands(weiToPrice(decode["1"],decode["2"])),
            wantAmountNow: weiToNUSD(decode["2"]),
            orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
            number: result.number,
            time: result.timestamp,
            filledTime: 0
          })
        } else if (id === "7ca3c7c7" && e.to == stableTokenAddress) { // BUY
          let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
          const packed = e.from.substring(2) + decode["0"].substring(2)
          console.log('BUYYYYYYYYYYYYYYYYYYYY')
          Trade.create({
            status: 'order',
            address: e.from,
            to: e.to,
            haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
            wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
            price: thousands(weiToPrice(decode["2"],decode["1"])),
            wantAmountNow: weiToMNTY(decode["2"]),
            orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
            number: result.number,
            time: result.timestamp,
            filledTime: 0
          })
        } else if (id === "37a7113d" && e.to == volatileTokenAddress) { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" ||
          let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
          const packed = e.from.substring(2) + decode["0"].substring(2)
          console.log('DEPOSIT&SELLLLLLLLLLLLL')
          Trade.create({
            status: 'order',
            address: e.from,
            to: e.to,
            haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
            wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
            price: thousands(weiToPrice(decode["1"],decode["2"])),
            wantAmountNow: weiToNUSD(decode["2"]),
            orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
            number: result.number,
            time: result.timestamp,
            filledTime: 0
          })
        } else if (id === "37a7113d" && e.to == stableTokenAddress) {
          let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
          const packed = e.from.substring(2) + decode["0"].substring(2)
          console.log('DEPOSIT&BUYYYYYYYYYYYYY')
          Trade.create({
            status: 'order',
            address: e.from,
            to: e.to,
            haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
            wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
            price: thousands(weiToPrice(decode["2"],decode["1"])),
            wantAmountNow: weiToMNTY(decode["2"]),
            orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
            number: result.number,
            time: result.timestamp,
            filledTime: 0
          })
        }
      })

      // Trade.find({$or: [{status: 'order'}, {status: 'filling'}]}, function (err, doc) {
      //   if (err) console.log(err)
      //   for (let j = 0; j < doc.length; j++) {
      //     if (doc[j].to == stableTokenAddress) {
      //       Seigniorage.methods.getOrder(1, doc[j].orderID).call(undefined, i-1, function (error, result1) {
      //         if (error) console.log(error)
      //         if (result1!=null && result1.maker  == burn) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         } else if (result1!=null && result1.maker != burn && parseFloat(weiToMNTY(result1.want))<parseFloat(doc[j].wantAmount.slice(0,-5))) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'filling', wantAmountNow: weiToMNTY(result1.want)}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         } else if (result1!=null && doc[j].status == 'filling' && parseFloat(weiToMNTY(result1.want))==parseFloat(doc[j].wantAmount.slice(0,-5))) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'order', wantAmountNow: doc[j].wantAmount.slice(0,-5)}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         }
      //       });
      //     } else {
      //       Seigniorage.methods.getOrder(0, doc[j].orderID).call(undefined, i-1, function (error, result1) {
      //         if (error) console.log(error)
      //         if (result1!=null && result1.maker == burn) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[j].wantAmount.slice(0,-6))) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'filling', wantAmountNow: weiToNUSD(result1.want)}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         } else if (result1!=null && doc[j].status == 'filling' && parseFloat(doc[j].wantAmount.slice(0,-6))==parseFloat(weiToNUSD(result1.want))) {
      //           Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'order', wantAmountNow: doc[j].wantAmount.slice(0,-6)}}, {useFindAndModify: false}, function (err, doc) {
      //             if (err) console.log(err)
      //           })
      //         }
      //       })
      //     }
      //   }
      // })

        // for (let n = 0; n < doc.length; n++) {
      //     Seigniorage.methods.getOrder(0, doc[n].orderID).call(undefined, i-6, function (error, result1) {
      //       if (err) console.log(err)
      //       if (result1!=null && result1.maker == burn) {
      //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
      //           if (err) console.log(err)
      //         })
      //       } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-6))) {
      //         Trade.findOneAndUpdate({
      //           orderID: doc[n].orderID}, {
      //             $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
      //           if (err) console.log(err)
      //         })
      //       }
      //     })
      //   }
      // });
      // Trade.find({to: stableTokenAddress,  $or: [{status: 'order'}, {status: 'filling'}]}, function (err, doc) {
      //   if (err) console.log(err)
      //   for (let n = 0; n < doc.length; n++) {
      //     Seigniorage.methods.getOrder(1, doc[n].orderID).call(undefined,i-6, function (error, result1) {
      //       if (err) console.log(err)
      //       if (result1!=null && result1.maker  == burn) {
      //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
      //           if (err) console.log(err)
      //         })
      //       } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-5))) {
      //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {
      //           $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
      //           if (err) console.log(err)
      //         })
      //       }
      //     })
      //   }
      // })
    }
  })
}

web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
  if (!error) {
    current_new_block = new_block.number
    Trade.findOne().sort({number: -1}).exec(function (err, db_block) {
      if (db_block == null)  db_block = {number: cursor}
      Trade.deleteMany({number: {$lte: db_block.number - 1000}, status: 'false'}, function (err, res) {
        if (err) console.log(err)
      })
      if (db_block.number < new_block.number -8 ) {
        if (scanning_old_blocks == 1) {
          console.log('beginNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN')
          Trade.deleteMany({number: {$gte: db_block.number - 200}}, function (err, res) {
            if (err) console.log(err)
            scanOldBlock()
            scanning_old_blocks++
          })
        } else scanning_old_blocks++
      } else {
        scanning_old_blocks = 1
        scanBlock(new_block.number - 6)
      }
    })
  }
})

function scanOldBlock() {
  Trade.findOne().sort({number: -1}).exec(function (err, db_block) {
    if (db_block == null) db_block = {number: cursor}
    array.splice(0, 100)
    if (db_block.number < current_new_block - 6) {
      let _from_block = Math.max(db_block.number + 1, cursor)
      array.push(_from_block)
      processArray(array)
    }
  })
}
async function processArray(array) {
  // map array to promises
  const promises = array.map(scanBlock)
  // wait until all promises are resolved
  await Promise.all(promises);
  setTimeout(function(){scanOldBlock()},5)
}
// async function processArray(array) {
//   for (const item of array) {
//     await scanBlock(item);
//   }
//   // console.log('Done!');
//   scanOldBlock()
// }


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
  if (end <= time_now) {
    Trade.find({status: 'filled', filledTime: {$gte: 1589870450, $lte: 1589871350}}).sort({filledTime: -1}).exec(function (err, doc) {
      console.log(doc)
      if (err) console.log(err)
      if (doc[0] != null) {
        console.log('!null')
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
              console.log('waitfirs',wait)
              setTimeout(function() {createCandle(end)}, wait)
            }
          })
        })
      } else {
        console.log('null')
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
              setTimeout(function() {createCandle(end)}, 1000)
            }
          })
        })
      }
    })
  } else {
    let wait = (end + 900 - time_now + 5)*1000
    console.log('waitout',wait)
    setTimeout(function() {createCandle(end)}, wait)
  }
}

// setTimeout(function(){
//   console.log('start')
//   Candle.findOne().sort({filledTime: -1}).exec(function (err, doc) {
//     if (err) console.log(err)
//     if(doc == null) {
//       Trade.findOne({status: 'filled'}).sort({filledTime: 1}).exec(function (err, doc1) {
//         if (err) console.log(err)
//         if (doc1 != null ) {
//           createFirstCandle(doc1.filledTime) // first point
//         } else setTimeout(function(){createFirstCandle(doc1.filledTime)},5000)
//       })
//     } else {
//       Candle.findOne({}).sort({time: -1}).exec(function (err, doc) {
//         if (err) console.log(err)
//         createCandle(doc.time)
//       })
//     }
//   })
// },60000)