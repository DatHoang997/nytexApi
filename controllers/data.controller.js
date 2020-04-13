var Data = require('../models/data.model')
var Trade = require('../models/trade.model')
var Web3 = require('web3');
var SeigniorageABI = require('../JSON/Seigniorage.json')
var StableTokenABI = require('../JSON/StableToken.json')
var VolatileTokenABI = require('../JSON/VolatileToken.json')
var sha256 = require('js-sha256');

const {
  cutString,
  thousands,
  weiToNTY,
  weiToMNTY,
  weiToNUSD,
  mntyToWei,
  nusdToWei,
  decShift
} = require('../util/help')

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ws.nexty.io"))

let Seigniorage = new web3.eth.Contract(SeigniorageABI, '0x0000000000000000000000000000000000023456');
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, '0x0000000000000000000000000000000000034567');
let StableToken = new web3.eth.Contract(StableTokenABI, '0x0000000000000000000000000000000000045678');

module.exports.trade = async function (req, res) {
  var cursor = 32042905
  scanBlock = async (_from_block, _to_block) => {
    for (let i = _from_block; i < _to_block; i++) {
      Trade.find({
        to: "0x0000000000000000000000000000000000034567",
      }, function (err, doc) {
        if (!err) {
          for (let n = 0; n < doc.length; n++) {
            Seigniorage.methods.getOrder(0, doc[n].orderID).call({
              undefined,
              i
            }, function (error, result) {
              if (!error && result.maker != '0x0000000000000000000000000000000000000000') {
                let fill = weiToNUSD(result.want) / doc[n].wantAmount * 100
                Trade.findOneAndUpdate({
                  orderID: decode["1"]
                }, {
                  $set: {
                    haveAmountNow: result.have,
                    wantAmountNow: result.want,
                  }
                }, function (err, doc) {
                  if (err) return handleError(err);
                });
              }
            });
          }
        }
      });
      Trade.find({
        to: "0x0000000000000000000000000000000000045678",
      }, function (err, doc) {
        if (!err) {
          for (let n = 0; n < doc.length; n++) {
            Seigniorage.methods.getOrder(1, doc[n].orderID).call({
              undefined,
              i
            }, function (error, result) {
              if (!error && result.maker != '0x0000000000000000000000000000000000000000') {
                let fill = weiToNUSD(result.want) / doc[n].wantAmount * 100
                Trade.findOneAndUpdate({
                  orderID: decode["1"]
                }, {
                  $set: {
                    status: 'filling',
                    haveAmountnow: result.have,
                    wantAmountnow: result.want,
                  }
                }, function (err, doc) {
                  if (err) return handleError(err);
                });
              }
            });
          }
        }
      });
      
      web3.eth.getBlock(32124216, true, function (error, result) {
        if (!error) {
          console.log(result)
          let time = result.timestamp
          var date = new Date(time * 1000);
          var day = date.getDate();
          var month = date.getMonth();
          var hours = date.getHours();
          var minutes = "0" + date.getMinutes();
          var seconds = "0" + date.getSeconds();
          var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
          if (result.transactions != null) {
            result.transactions.forEach(function (e) {
              let id = e.input.slice(2, 10);
              let para = '0x' + e.input.slice(10);

              if (id === "37a7113d" || id === "7ca3c7c7") {
                if (e.to == "0x0000000000000000000000000000000000034567") { //depositAndTrade(bytes32,uint256,uint256,bytes32)
                  var decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
                  const packed = e.from.substring(2) + decode["0"].substring(2)
                  Trade.findOne({
                    orderID: '0x' + sha256(Buffer.from(packed, 'hex'))
                  }).exec(async function (err, db) {
                    if (db == null) {
                      Trade.create({
                        status: 'order',
                        index: decode["0"],
                        address: e.from,
                        to: e.to,
                        haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
                        wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
                        haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
                        wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
                        orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
                        fill: 0,
                        number: result.number,
                        time: formattedTime,
                      }, function (err) {
                        if (err) return handleError(err);
                      });
                    }
                  })
                } else if (e.to == "0x0000000000000000000000000000000000045678") {
                  var decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
                  const packed = e.from.substring(2) + decode["0"].substring(2)
                  Trade.findOne({
                    orderID: '0x' + sha256(Buffer.from(packed, 'hex'))
                  }).exec(async function (err, db) {
                    if (db == null) {
                      Trade.create({
                        status: 'order',
                        index: decode["0"],
                        address: e.from,
                        to: e.to,
                        haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
                        wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
                        haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
                        wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
                        orderID: '0x' + sha256(e.from + decode["0"]),
                        fill: 0,
                        number: result.number,
                        time: formattedTime,
                      }, function (err) {
                        if (err) return handleError(err);
                      });
                    }
                  })
                }
              } else if (id == "43271d79") { //cancel(bool, ID bytes32)
                var decode = web3.eth.abi.decodeParameters(['bool', 'bytes32'], para);
                Trade.findOneAndUpdate({
                  orderID: decode["1"]
                }, {
                  $set: {
                    status: 'cancled'
                  }
                }, function (err, doc) {
                  if (err) return handleError(err);
                });
              }
            })
          } else {}
        }
      });
    }
  }

  web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
    if (!error) {
      Trade.findOne().sort({
        number: -1
      }).exec(async function (err, db_block) {
        if (db_block == null) {
          db_block = {
            number: cursor
          }
        }
        Trade.deleteMany({
          number: {
            $lte: db_block.number - 1000
          },
          status: false
        }, function (err, res) {
          if (err) console.log(err)
        })
        if (db_block.number < new_block.number - 6) {
          let _from_block = Math.max(db_block.number, cursor)
          let _to_block = Math.min(new_block.number - 6, db_block.number + 100)
          console.log("db " + db_block.number)
          console.log("new " + new_block.number)
          await scanBlock(_from_block + 1, _to_block)
        } else {
          await scanBlock(new_block.number - 6, new_block.number - 6)
        }
      })
    }
  })

}