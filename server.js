const express = require('express')
const app = express()
const port = 8881
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dataRoute = require('./routes/data.route')
var cors = require('cors');

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

// let scanning_old_blocks = 1
// let array = []
// console.log('start')

// let cursor = 28588000 //28588000   //33068795 //33118783
// async function scanBlock(i) {
//   console.log(i)
//   Trade.create({status: 'false',number: i}, function (err) {
//     if (err) console.log(err)
//   })
//   web3.eth.getBlock(33118784, true, function (err, result) { //31945638
//     if (err) console.log(err)
//     if (result.transactions != null) {
//       result.transactions.forEach(function (e) {
//         let id = e.input.slice(2, 10)
//         let para = '0x' + e.input.slice(10)
//         if (id === "7ca3c7c7" && e.to == volatileTokenAddress) { //SELL depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" ||
//           let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
//           const packed = e.from.substring(2) + decode["0"].substring(2)
//           console.log('SELLLLLLLLLLLLLLLLLLL')
//           Trade.create({
//             status: 'order',
//             address: e.from,
//             to: e.to,
//             haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
//             wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
//             price: thousands(weiToPrice(decode["1"], decode["2"])),
//             wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
//             orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
//             number: result.number,
//             time: result.timestamp,
//             filledTime: 0
//           })
//         } else if (id === "7ca3c7c7" && e.to == stableTokenAddress) { // BUY
//           let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
//           const packed = e.from.substring(2) + decode["0"].substring(2)
//           console.log('BUYYYYYYYYYYYYYYYYYYYY')
//           Trade.create({
//             status: 'order',
//             address: e.from,
//             to: e.to,
//             haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
//             wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
//             price: thousands(weiToPrice(decode["2"], decode["1"])),
//             haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
//             wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
//             orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
//             number: result.number,
//             time: result.timestamp,
//             filledTime: 0
//           })
//         } else if (id === "37a7113d" && e.to == volatileTokenAddress) { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" ||
//           let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
//           const packed = e.from.substring(2) + decode["0"].substring(2)
//           console.log('DEPOSIT&SELLLLLLLLLLLLL')
//           Trade.create({
//             status: 'order',
//             address: e.from,
//             to: e.to,
//             haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
//             wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
//             price: thousands(weiToPrice(decode["1"], decode["2"])),
//             haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
//             wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
//             orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
//             number: result.number,
//             time: result.timestamp,
//             filledTime: 0
//           })
//         } else if (id === "37a7113d" && e.to == stableTokenAddress) {
//           let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para)
//           const packed = e.from.substring(2) + decode["0"].substring(2)
//           console.log('DEPOSIT&BUYYYYYYYYYYYYY')
//           Trade.create({
//             status: 'order',
//             address: e.from,
//             to: e.to,
//             haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
//             wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
//             price: thousands(weiToPrice(parseInt(decode["2"]), parseInt(decode["1"]))),
//             haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
//             wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
//             orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
//             number: result.number,
//             time: result.timestamp,
//             filledTime: 0
//           })
//         } else if (id == "43271d79") { //cancel(bool, ID bytes32)
//           let decode = web3.eth.abi.decodeParameters(['bool', 'bytes32'], para)
//           Trade.findOneAndUpdate({orderID: decode["1"]}, {$set: {status: 'canceled'}}, {useFindAndModify: false}, function (err, doc) {
//             if (err) console.log(err)
//           })
//         }
//       })
//       Trade.find({
//         $or: [{
//           status: 'order'
//         }, {
//           status: 'filling'
//         }]
//       }, function (err, doc) {
//         if (err) console.log(err)
//         for (let j = 0; j < doc.length; j++) {
//           if (doc[j].to == stableTokenAddress) {
//             Seigniorage.methods.getOrder(1, doc[j].orderID).call(undefined, i - 6, function (error, result1) {
//               if (err) console.log(err)
//               if (result1 != null && result1.maker == burn) {
//                 Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {status: 'filled',filledTime: result.timestamp}},
//                 {useFindAndModify: false}, function (err, doc) {
//                   if (err) console.log(err)
//                 })
//               } else if (result1 != null && result1.maker != burn && parseFloat(weiToNUSD(result1.want)) < parseFloat(doc[0].wantAmount.slice(0, -5))) {
//                 Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {
//                   status: 'filling',
//                   filledTime: result.timestamp - 10,
//                   wantAmountNow: weiToNUSD(result1.want)
//                 }}, {useFindAndModify: false}, function (err, doc) {
//                   if (err) console.log(err)
//                 })
//               }
//             });
//           } else {
//             Seigniorage.methods.getOrder(0, doc[j].orderID).call(undefined, i - 6, function (error, result1) {
//               if (err) console.log(err)
//               if (result1 != null && result1.maker == burn) {
//                 Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {
//                   status: 'filled',
//                   filledTime: result.timestamp - 10,
//                   wantAmountNow: weiToMNTY(result1.want)
//                 }}, {useFindAndModify: false}, function (err, doc) {
//                   if (err) console.log(err)
//                 })
//               } else if (result1 != null && result1.maker != burn && parseFloat(weiToMNTY(result1.want)) < parseFloat(doc[0].wantAmount.slice(0, -6))) {
//                 Trade.findOneAndUpdate({orderID: doc[j].orderID}, {$set: {
//                   status: 'filling',
//                   wantAmountNow: result1.want
//                 }}, {useFindAndModify: false}, function (err, doc) {
//                   if (err) console.log(err)
//                 })
//               }
//             })
//           }
//         }
//       })

//       //   for (let n = 0; n < doc.length; n++) {
//       //     Seigniorage.methods.getOrder(0, doc[n].orderID).call(undefined, i-6, function (error, result1) {
//       //       if (err) console.log(err)
//       //       if (result1!=null && result1.maker == burn) {
//       //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
//       //           if (err) console.log(err)
//       //         })
//       //       } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-6))) {
//       //         Trade.findOneAndUpdate({
//       //           orderID: doc[n].orderID}, {
//       //             $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
//       //           if (err) console.log(err)
//       //         })
//       //       }
//       //     })
//       //   }
//       // });
//       // Trade.find({to: stableTokenAddress,  $or: [{status: 'order'}, {status: 'filling'}]}, function (err, doc) {
//       //   if (err) console.log(err)
//       //   for (let n = 0; n < doc.length; n++) {
//       //     Seigniorage.methods.getOrder(1, doc[n].orderID).call(undefined,i-6, function (error, result1) {
//       //       if (err) console.log(err)
//       //       if (result1!=null && result1.maker  == burn) {
//       //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
//       //           if (err) console.log(err)
//       //         })
//       //       } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-5))) {
//       //         Trade.findOneAndUpdate({orderID: doc[n].orderID}, {
//       //           $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
//       //           if (err) console.log(err)
//       //         })
//       //       }
//       //     })
//       //   }
//       // })
//     }
//   })
// }

// web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
//   if (!error) {
//     current_new_block = new_block.number
//     Trade.findOne().sort({
//       number: -1
//     }).exec(async function (err, db_block) {
//       if (db_block == null) db_block = {
//         number: cursor
//       }
//       Trade.deleteMany({
//         number: {
//           $lte: db_block.number - 1000
//         },
//         status: 'false'
//       }, function (err, res) {
//         if (err) console.log(err)
//       })
//       if (db_block.number < new_block.number - 7) {
//         if (scanning_old_blocks == 1) {
//           console.log('beginNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN')
//           Trade.deleteMany({
//             number: {
//               $gte: db_block.number - 200
//             }
//           }, function (err, res) {
//             if (err) console.log(err)
//             scanOldBlock()
//             scanning_old_blocks++
//           })
//         } else scanning_old_blocks++
//       } else {
//         scanning_old_blocks = 1
//         await scanBlock(new_block.number - 6)
//       }
//     })
//   }
// })

// async function scanOldBlock() {
//   Trade.findOne().sort({
//     number: -1
//   }).exec(async function (err, db_block) {
//     if (db_block == null) db_block = {
//       number: cursor
//     }
//     array.splice(0, 100)
//     if (db_block.number < current_new_block - 7) {
//       let _from_block = Math.max(db_block.number, cursor)
//       let _to_block = Math.min(current_new_block - 6, db_block.number + 5)
//       for (let i = _from_block + 1; i <= _to_block; i++) array.push(i)
//       processArray(array)
//     }
//   })
// }
// async function processArray(array) {
//   // map array to promises
//   const promises = array.map(scanBlock)
//   // wait until all promises are resolved
//   await Promise.all(promises);
//   scanOldBlock()
// }
// res.send('collecting...')