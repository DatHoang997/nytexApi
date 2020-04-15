var Data = require('../models/data.model')
var Trade = require('../models/trade.model')
var Web3 = require('web3');
var SeigniorageABI = require('../JSON/Seigniorage.json')
var StableTokenABI = require('../JSON/StableToken.json')
var VolatileTokenABI = require('../JSON/VolatileToken.json')
var sha256 = require('js-sha256');

const {weiToNTY,weiToMNTY,weiToNUSD,} = require('../util/help')


const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ws.nexty.io"))

let Seigniorage = new web3.eth.Contract(SeigniorageABI, '0x0000000000000000000000000000000000023456');
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, '0x0000000000000000000000000000000000034567');
let StableToken = new web3.eth.Contract(StableTokenABI, '0x0000000000000000000000000000000000045678');

module.exports.trade = async function (req, res) {
  var cursor = 32214930
  web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
    let i = new_block.number
   console.log(i)
        Trade.find({to: "0x0000000000000000000000000000000000034567",}, function (err, doc) {
          if (!err) {
            for (let n = 0; n < doc.length; n++) {
              Seigniorage.methods.getOrder(1, doc[n].orderID).call({undefined,i}, function (error, result) {
                if (!error && result.maker != '0x0000000000000000000000000000000000000000' && result.want<doc.wantAmount) {
                  Trade.findOneAndUpdate({
                    orderID: doc[n].orderID}, {$set: {haveAmountNow: result.have,wantAmountNow: result.want,}}, function (err, doc) {
                    if (err) return handleError(err);
                  });
                }else if (!error && result.want == '0x0000000000000000000000000000000000000000') {
                  Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled'}}, {useFindAndModify: false}, function (err, doc) {
                    if (err) return handleError(err);
                  });
                }
              });
            }
          }
        });
        Trade.find({to: "0x0000000000000000000000000000000000045678",}, function (err, doc) {
          if (!err) {
            for (let n = 0; n < doc.length; n++) {
              Seigniorage.methods.getOrder(1, doc[n].orderID).call({undefined,i}, function (error, result) {
                if (!error && result.maker != '0000000000000000000000000000000000000000' && result.want<doc.wantAmount) {
                  Trade.findOneAndUpdate({orderID: doc[n].orderID}, {
                    $set: {
                      status: 'filling',
                      haveAmountnow: result.have,
                      wantAmountnow: result.want,
                    }}, {useFindAndModify: false}, function (err, doc) {
                    if (err) return handleError(err);
                  });
                }else if (!error && result.want   == '0000000000000000000000000000000000000000') {
                  Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled'}}, {useFindAndModify: false}, function (err, doc) {
                    if (err) return handleError(err);
                  });
                }
              });
            }
          }
        });
        Trade.create({status: 'false', number: i}, function (err) {
          if (err) return handleError(err);
        });
        web3.eth.getBlock(i, true, function (error, result) { //31945638 
          if (!error) {
            // console.log(result)
            let time = result.timestamp
            var date = new Date(time * 1000);
            var day = date.getDate();
            var month = date.getMonth()+1;
            var hours = date.getHours();
            var minutes = "0" + date.getMinutes();
            var seconds = "0" + date.getSeconds();
            var formattedTime = day + '-' + ("0" + month).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            if (result.transactions != null) {
              result.transactions.forEach(function (e) {
                let id = e.input.slice(2, 10);
                let para = '0x' + e.input.slice(10);
                if (id === "7ca3c7c7") { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" || 
                  if (e.to == "0x0000000000000000000000000000000000034567") { 
                    var decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
                    const packed = e.from.substring(2) + decode["0"].substring(2)
                    Trade.findOne({orderID: '0x' + sha256(Buffer.from(packed, 'hex'))}).exec(async function (err, db) {
                      if (db == null) {
                        Trade.create({
                          status: 'order',
                          address: e.from,
                          to: e.to,
                          haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
                          wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
                          haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
                          wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
                          orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
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
                    console.log('0x' + sha256(Buffer.from(packed, 'hex')))
                    Trade.findOne({orderID: '0x' + sha256(Buffer.from(packed, 'hex'))}).exec(async function (err, db) {
                      if (db == null) {
                        Trade.create({
                          status: 'order',
                          address: e.from,
                          to: e.to,
                          haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
                          wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
                          haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
                          wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
                          orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
                          number: result.number,
                          time: formattedTime,
                        }, function (err) {
                          if (err) return handleError(err);
                        });
                      }
                    })
                  }
                }
                else if (id === "37a7113d") { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" || 
                  if (e.to == "0x0000000000000000000000000000000000034567") { 
                    var decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
                    const packed = e.from.substring(2) + decode["0"].substring(2)
                    Trade.findOne({orderID: '0x' + sha256(Buffer.from(packed, 'hex'))}).exec(async function (err, db) {
                      if (db == null) {
                        Trade.create({
                          status: 'order',
                          address: e.from,
                          to: e.to,
                          haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
                          wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
                          haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
                          wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
                          orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
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
                    console.log('aaa'+packed)

                    Trade.findOne({orderID: '0x' + sha256(Buffer.from(packed, 'hex'))}).exec(async function (err, db) {
                      if (db == null) {
                        Trade.create({
                          status: 'order',
                          address: e.from,
                          to: e.to,
                          haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
                          wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
                          haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
                          wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
                          orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
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
                  console.log(decode["1"])
                  Trade.findOneAndUpdate({orderID: decode["1"]}, {$set: {status: 'canceled'}}, function (err, doc) {
                    if (err) return handleError(err);
                  });
                }
              })
            }
          }
        });
    
  })
  // web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
  //   if (!error) {
  //     Trade.findOne().sort({number: -1}).exec(async function (err, db_block) {
  //       if (db_block == null) {
  //         db_block = {number: cursor}
  //       }
  //       Trade.deleteMany({number: {$lte: db_block.number - 1000},status: 'false'}, function (err, res) {
  //         if (err) console.log(err)
  //       })
  //       if (db_block.number < new_block.number - 6) {
  //         let _from_block = Math.max(db_block.number, cursor)
  //         let _to_block = Math.min(new_block.number - 6, db_block.number + 200)
  //         console.log("db " + db_block.number)
  //         console.log("new " + new_block.number)
  //         await scanBlock(_from_block + 1, _to_block)
  //       } else {
  //         await scanBlock(new_block.number - 6, new_block.number - 6)
  //       }
  //     })
  //   }
  // })
}

module.exports.block = async function (req, res) {
  var cursor = 26500000
  scanBlock = async (_from_block, _to_block) => {
    var e1 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Propose', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'maker',
            indexed: true
          }, {
            type: 'int256',
            name: 'amount',
          }, {
            type: 'uint256',
            name: 'stake',
          }, {
            type: 'uint256',
            name: 'lockdownExpiration',
          }, {
            type: 'uint256',
            name: 'slashingRate',
          }], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
              let time = result1.timestamp
              var date = new Date(time * 1000);
              var day = date.getDate();
              var month = date.getMonth();
              var hours = date.getHours();
              var minutes = "0" + date.getMinutes();
              var seconds = "0" + date.getSeconds();
              var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Propose',
                event: {
                  param1: 'Maker: ' + eventparam[0],
                  param2: 'Amount: ' + weiToNUSD(eventparam[1]) + ' NewSD',
                  param3: 'Stake: ' + weiToMNTY(eventparam[2]) + ' MNTY',
                  param4: 'LockdownExpiration: ' + eventparam[3],
                  param5: 'SlashingRate: ' + eventparam[4]
                },
                time: formattedTime
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    var e2 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Unlock', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'maker',
            indexed: true
          }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Unlock',
            event: {
              param1: 'Address : ' + eventparam[0],
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e3 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Slash', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'maker',
            indexed: true
          }, {
            type: 'uint256',
            name: 'amount',
          }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Slash',
            event: {
              param1: 'Address: ' + eventparam[0],
              param2: 'Amount: ' + weiToMNTY(eventparam[1]) + ' MNTY',
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e4 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Revoke', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'maker',
            indexed: true
          }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Revoke',
            event: {
              param1: 'Address: ' + eventparam[0],
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e5 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Preemptive', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'maker',
            indexed: true
          }, {
            type: 'uint256',
            name: 'stake',
          }, {
            type: 'uint256',
            name: 'lockdownExpiration',
          }, {
            type: 'uint256',
            name: 'unlockNumber'
          }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Preemptive',
            event: {
              param1: 'Maker: ' + eventparam[0],
              param2: 'Stake: ' + weiToMNTY(eventparam[1]) + ' MNTY',
              param3: 'LockdownExpiration: ' + eventparam[2],
              param4: 'UnlockNumber: ' + eventparam[3],
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e6 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Absorption', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'int256',
            name: 'amount'
          }, {
            type: 'uint256',
            name: 'supply',
          }, {
            type: 'bool',
            name: 'emptive',
          }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Absorption',
            event: {
              param1: 'Amount: ' + weiToNTY(eventparam[0]) + ' NTY',
              param2: 'Supply: ' + eventparam[1],
              param3: 'Emptive: ' + eventparam[2],
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e7 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Stop', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Stop()',
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e8 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Transfer', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'from',
            indexed: true
          }, {
            type: 'address',
            name: 'to',
            indexed: true
          }, {
            type: 'uint256',
            name: 'value',
          }], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
              let time = result1.timestamp
              var date = new Date(time * 1000);
              var day = date.getDate();
              var month = date.getMonth();
              var hours = date.getHours();
              var minutes = "0" + date.getMinutes();
              var seconds = "0" + date.getSeconds();
              var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToNUSD(eventparam[2]) + ' NewSD',
                },
                time: formattedTime
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    var e9 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Transfer', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "_data",
              "type": "bytes"
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
              let time = result1.timestamp
              var date = new Date(time * 1000);
              var day = date.getDate();
              var month = date.getMonth();
              var hours = date.getHours();
              var minutes = "0" + date.getMinutes();
              var seconds = "0" + date.getSeconds();
              var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToMNTY(eventparam[2]) + ' MNTY',
                  param4: 'data: ' + eventparam[3],
                },
                time: formattedTime
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    var e10 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('OwnershipTransferred', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              indexed: true,
              name: 'previousOwner',
              type: 'address'
            },
            {
              indexed: true,
              name: 'newOwner',
              type: 'address'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: OwnershipTransferred',
            event: {
              param1: 'previousOwner: ' + eventparam[0],
              param2: 'newOwner: ' + eventparam[1]
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e11 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Approval', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              indexed: true,
              name: 'owner',
              type: 'address'
            },
            {
              indexed: true,
              name: 'spender',
              type: 'address'
            },
            {
              indexed: false,
              name: 'value',
              type: 'uint256'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Approval',
            event: {
              param1: 'Owner: ' + eventparam[0],
              param2: 'Spender: ' + eventparam[1],
              param2: 'Value: ' + weiToNUSD(eventparam[2]) + ' NewSD'
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e12 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Transfer', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
            type: 'address',
            name: 'from',
            indexed: true
          }, {
            type: 'address',
            name: 'to',
            indexed: true
          }, {
            type: 'uint256',
            name: 'value',
          }], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
              let time = result1.timestamp
              var date = new Date(time * 1000);
              var day = date.getDate();
              var month = date.getMonth();
              var hours = date.getHours();
              var minutes = "0" + date.getMinutes();
              var seconds = "0" + date.getSeconds();
              var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToMNTY(eventparam[2]) + ' MNTY',
                },
                time: formattedTime
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    var e13 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Transfer', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              "indexed": true,
              "name": "_from",
              "type": "address"
            },
            {
              "indexed": true,
              "name": "_to",
              "type": "address"
            },
            {
              "indexed": false,
              "name": "_value",
              "type": "uint256"
            },
            {
              "indexed": false,
              "name": "_data",
              "type": "bytes"
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
              let time = result1.timestamp
              var date = new Date(time * 1000);
              var day = date.getDate();
              var month = date.getMonth();
              var hours = date.getHours();
              var minutes = "0" + date.getMinutes();
              var seconds = "0" + date.getSeconds();
              var formattedTime = day + '-' + ("0" + month + 1).slice(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToMNTY(eventparam[2]) + ' MNTY',
                  param4: 'data: ' + eventparam[3],
                },
                time: formattedTime
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    var e14 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('OwnershipTransferred', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              indexed: true,
              name: 'previousOwner',
              type: 'address'
            },
            {
              indexed: true,
              name: 'newOwner',
              type: 'address'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: OwnershipTransferred',
            event: {
              param1: 'previousOwner: ' + eventparam[0],
              param2: 'newOwner: ' + eventparam[1]
            },
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    var e15 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Approval', {
        fromBlock: _from_block,
        toBlock: _to_block
      }, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              indexed: true,
              name: 'owner',
              type: 'address'
            },
            {
              indexed: true,
              name: 'spender',
              type: 'address'
            },
            {
              indexed: false,
              name: 'value',
              type: 'uint256'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: Approval',
            event: {
              param1: 'Owner: ' + eventparam[0],
              param2: 'Spender: ' + eventparam[1],
              param2: 'Value: ' + weiToMNTY(eventparam[2]) + ' MNTY'
            }
          }
          resolve(data)
        } else {
          resolve(null)
        }
      })
    })

    Promise.all([e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15])
      .then(data => {
        if (data[0] == null && data[1] == null && data[2] == null && data[3] == null && data[4] == null && data[5] == null && data[6] == null && data[7] == null && data[8] == null && data[9] == null && data[10] == null && data[11] == null && data[12] == null && data[13] == null && data[14] == null) {
          Data.create({
            status: false,
            number: _to_block
          }, function (err) {
            if (err) return handleError(err);
          });
        } else {
          for (let i = 0; i <= data.length - 1; i++) {
            if (data[i] != null) {
              Data.create(data[i], function (err) {
                if (err) return handleError(err);
              });
            }
          }
        }
      }, reason => {
        console.log(reason)
      });
  }
  // scanBlock(28587379,28588311)

  web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
    if (!error) {
      Data.findOne().sort({
        number: -1
      }).exec(async function (err, db_block) {
        if (db_block == null) {
          db_block = {
            number: cursor
          }
        }
        Data.deleteMany({
          number: {
            $lte: db_block.number - 1000
          },
          status: false
        }, function (err, res) {
          if (err) console.log(err)
        })
        if (db_block.number < new_block.number - 6) {
          let _from_block = Math.max(db_block.number, cursor)
          let _to_block = Math.min(new_block.number - 6, db_block.number + 100000)
          await scanBlock(_from_block + 1, _to_block)
        } else {
          await scanBlock(new_block.number - 6, new_block.number - 6)
        }
      })
    }
  })
}



module.exports.show = async function (req, res) {
  var show = await Data.find({
    status: true,
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.preemptive = async function (req, res) {
  var show = await Data.find({
    status: true,
    Event: "Preemptive"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.propose = async function (req, res) {
  var show = await Data.find({
    status: true,
    name: "Event: Propose"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.transfer = async function (req, res) {
  var show = await Data.find({
    status: true,
    name: "Event: Transfer"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.absorption = async function (req, res) {
  var show = await Data.find({
    status: true,
    name: "Event: Absorption"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.slash = async function (req, res) {
  var show = await Data.find({
    status: true,
    name: "Event: Slash"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.approval = async function (req, res) {
  var show = await Data.find({
    status: true,
    name: "Event: Approval"
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.clear = async function (req, res) {
  Data.deleteMany({}, function (err, res) {
    if (err) console.log(err)
  })
  res.send('da xoa DB')
}

module.exports.gettoptrade = async function (req, res) {
  var show = await Trade.find({status:'order'}).limit(40).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.getopenorder = async function (req, res) {
  var show = await Trade.find({
    $or: [ { status: 'order' }, { status: 'filling' } ]
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.getopenhistory = async function (req, res) {
  var show = await Trade.find({
    $or: [ { status: 'canceled' }, { status: 'filled' }, { status: 'order' } ]
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}

module.exports.gettradehistory = async function (req, res) {
  var show = await Trade.find({
    $or: [ { status: 'filling' }, { status: 'filled' } ]
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}



module.exports.tradeclear = async function (req, res) {
  Trade.deleteMany({}, function (err, res) {
    if (err) console.log(err)
  })
  res.send('da xoa DB')
}
