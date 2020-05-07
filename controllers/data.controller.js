const url = require('url');
let Data = require('../models/data.model')
let Trade = require('../models/trade.model')
let Candle = require('../models/candle.model')
let Web3 = require('web3');
let SeigniorageABI = require('../JSON/Seigniorage.json')
let StableTokenABI = require('../JSON/StableToken.json')
let VolatileTokenABI = require('../JSON/VolatileToken.json')
let sha256 = require('js-sha256');
let current_new_block
const {weiToNTY, weiToMNTY, weiToNUSD,} = require('../util/help')

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ws.nexty.io'))
let seigniorageAddress = '0x0000000000000000000000000000000000023456'
let volatileTokenAddress = '0x0000000000000000000000000000000000034567'
let stableTokenAddress = '0x0000000000000000000000000000000000045678'
let burn = '0x0000000000000000000000000000000000000000'
let Seigniorage = new web3.eth.Contract(SeigniorageABI, seigniorageAddress);
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, volatileTokenAddress);
let StableToken = new web3.eth.Contract(StableTokenABI, stableTokenAddress);


module.exports.candle = function (req, res) {
  function createFirstCandle(begin) {
    // console.log('run', begin)
    end = begin + 900
    // console.log('end',end)
    Trade.find({status: 'filled', filledTime: {$gte: begin, $lt: end}}).exec( function (err, doc) {
      if (err) return handleError(err);
      let array = []
      for (let i = 0; i < doc.length; i++) array.push(doc[i].price)
      Candle.create({
        open: doc[0].price,
        top: Math.max.apply(Math, array),
        bot: Math.min.apply(Math, array),
        close: doc[doc.length-1].price,
        time: end
      }, function (err) {
        if (err) return handleError(err);
        Trade.findOne().sort({time: -1}).exec(async function (err, doc) {
          if (err) return handleError(err);
          if (end + 900 < doc.time) createCandle(end)
          else {
            let wait = (end + 900 - doc.time  + 5)*1000
            console.log('waitfirs',wait)
            setTimeout(function() {createCandle(end); }, wait)
          }
        })
      })
    })
  }

  function createCandle(begin) {
    // console.log('run', begin)
    end = begin + 900
    // console.log('end',end)
    Trade.find({status: 'filled', filledTime: {$gte: begin, $lt: end}}).exec( function (err, doc) {
      if (err) return handleError(err);
      // console.log(doc)
      if (doc[0] != null) {
        Candle.findOne().sort({time: -1}).exec(async function (err, doc1) {
          // console.log('doc1111111', doc1.close)
          let array = []
          for (let i = 0; i < doc.length; i++) array.push(doc[i].price, doc1.close)
          Candle.create({
            open: doc1.close,
            top: Math.max.apply(Math, array),
            bot: Math.min.apply(Math, array),
            close: doc[doc.length-1].price,
            time: end
          }, function (err) {
            if (err) return handleError(err);
            Trade.findOne().sort({time: -1}).exec(async function (err, doc) {
              if (err) return handleError(err);
              if (end + 900 < doc.time) createCandle(end)
              else {
                let wait = (end + 900 - doc.time  + 5)*1000
                console.log('wait1',wait)
                setTimeout(function() {createCandle(end); }, wait)
              }
            })
          })
        })
      } else {
        Candle.findOne().sort({time: -1}).exec(async function (err, doc) {
          if (err) return handleError(err);
          // console.log('aaaa',doc.close)
          Candle.create({
            open: doc.close,
            top: doc.close,
            bot: doc.close,
            close: doc.close,
            time: end
          }, function (err) {
            if (err) return handleError(err);
            Trade.findOne().sort({time: -1}).exec(async function (err, doc) {
              // console.log(end, doc.time)
              if (err) return handleError(err);
              if (end + 900 < doc.time) {
                createCandle(end)
              } else {
                let wait = (end + 900 - doc.time  + 5)*1000
                console.log('wait2',wait)
                setTimeout(function() {createCandle(end); }, wait)
              }
            })    
          })
        })
      }
    })
  }


  //start
  console.log('start')
  Candle.findOne().sort({filledTime: -1}).exec(async function (err, doc) {
    // console.log('doc', doc)
    if (err) return handleError(err);
    if(doc == null) {
      Trade.findOne({status: 'filled'}).sort({filledTime: 1}).exec(async function (err, doc1) {
        if (err) return handleError(err);
        if (doc1 != null ) {
          createFirstCandle(doc1.filledTime) // first point
          res.send('collecting1...')
        } else res.send('Wait for the database to complete then run again')
        
      })
    } else {
      Candle.findOne({}).sort({time: -1}).exec(async function (err, doc) {
        if (err) return handleError(err); 
          // console.log(doc)
        createCandle(doc.time)
          // console.log(doc.time)
        res.send('collecting2...')
      })
    }
  })
}


module.exports.trade = async function (req, res) {
  let scanning_old_blocks = 1
  let array = []
  console.log('start')

  let cursor = 28000000
  async function scanBlock(i) {
    console.log(i)
    Trade.create({status: 'false', number: i}, function (err) {
      if (err) return handleError(err);
    });
    web3.eth.getBlock(i, true, function (err, result) { //31945638 
      if (err) return handleError(err);
      // console.log(result)
      if (result.transactions != null) {
        result.transactions.forEach(function (e) {
          let id = e.input.slice(2, 10);
          let para = '0x' + e.input.slice(10);
          if (id === "7ca3c7c7" && e.to == volatileTokenAddress) { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" || 
            let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
            const packed = e.from.substring(2) + decode["0"].substring(2)
            Trade.create({
              status: 'order',
              address: e.from,
              to: e.to,
              haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
              wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
              price: parseFloat(weiToMNTY(decode["1"])) / parseFloat(weiToNUSD(decode["2"])),
              haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
              wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
              orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
              number: result.number,
              time: result.timestamp,
              filledTime: 0
            }, function (err) {
              if (err) return handleError(err);
            });
          } else if (id === "7ca3c7c7" && e.to == stableTokenAddress) {
            let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
            const packed = e.from.substring(2) + decode["0"].substring(2)
            Trade.create({
              status: 'order',
              address: e.from,
              to: e.to,
              haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
              wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
              price: parseFloat(weiToMNTY(decode["2"])) / parseFloat(weiToNUSD(decode["1"])),
              haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
              wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
              orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
              number: result.number,
              time: result.timestamp,
              filledTime: 0
            }, function (err) {
              if (err) return handleError(err);
            });
          } else if (id === "37a7113d" && e.to == volatileTokenAddress) { //depositAndTrade(bytes32,uint256,uint256,bytes32) trade(bytes32,uint256,uint256,bytes32) id === "37a7113d" || 
            let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
            const packed = e.from.substring(2) + decode["0"].substring(2)
              Trade.create({
                status: 'order',
                address: e.from,
                to: e.to,
                haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
                wantAmount: weiToNUSD(decode["2"]) + ' NewSD',
                price: parseFloat(weiToMNTY(decode["1"])) / parseFloat(weiToNUSD(decode["2"])),
                haveAmountNow: weiToMNTY(decode["1"]) + ' MNTY',
                wantAmountNow: weiToNUSD(decode["2"]) + ' NewSD',
                orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
                number: result.number,
                time: result.timestamp,
                filledTime: 0
              }, function (err) {
                if (err) return handleError(err);
              });
          } else if (id === "37a7113d" && e.to == stableTokenAddress) {
            let decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
            const packed = e.from.substring(2) + decode["0"].substring(2)
            Trade.create({
              status: 'order',
              address: e.from,
              to: e.to,
              haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
              wantAmount: weiToMNTY(decode["2"]) + ' MNTY',
              price: parseFloat(weiToMNTY(decode["2"])) / parseFloat(weiToNUSD(decode["1"])),
              haveAmountNow: weiToNUSD(decode["1"]) + ' NewSD',
              wantAmountNow: weiToMNTY(decode["2"]) + ' MNTY',
              orderID: '0x' + sha256(Buffer.from(packed, 'hex')),
              number: result.number,
              time: result.timestamp,
              filledTime: 0
            }, function (err) {
              if (err) return handleError(err);
            });
          } else if (id == "43271d79") { //cancel(bool, ID bytes32)
            let decode = web3.eth.abi.decodeParameters(['bool', 'bytes32'], para);
            Trade.findOneAndUpdate({orderID: decode["1"]}, {$set: {status: 'canceled'}}, {useFindAndModify: false}, function (err, doc) {
              if (err) return handleError(err);
              // console.log('cancel',decode["1"] )
            });
          }
        })
        Trade.find({to: volatileTokenAddress,  $or: [{ status: 'order' }, { status: 'filling' }]}, function (err, doc) {
          if (err) return handleError(err);
          for (let n = 0; n < doc.length; n++) {
            Seigniorage.methods.getOrder(0, doc[n].orderID).call(undefined, i-1, function (error, result1) {
              if (err) return handleError(err);
              if (result1!=null && result1.maker == burn) {
                Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
                  if (err) return handleError(err);
                });
              } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-6))) {
                Trade.findOneAndUpdate({
                  orderID: doc[n].orderID}, {
                    $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
                  if (err) return handleError(err);
                });
              }
            });
          }
        });
        Trade.find({to: stableTokenAddress,  $or: [{status: 'order'}, {status: 'filling'}]}, function (err, doc) {
          if (err) return handleError(err);
          for (let n = 0; n < doc.length; n++) {
            Seigniorage.methods.getOrder(1, doc[n].orderID).call(undefined,i-1, function (error, result1) {
              if (err) return handleError(err);
              // console.log(weiToMNTY(result.want)) parseFloat(doc.wantAmount.slice(0,-5))
              if (result1!=null && result1.maker  == burn) {
                Trade.findOneAndUpdate({orderID: doc[n].orderID}, {$set: {status: 'filled', filledTime: result.timestamp}}, {useFindAndModify: false}, function (err, doc) {
                  if (err) return handleError(err);
                });
              } else if (result1!=null && result1.maker != burn && parseFloat(weiToNUSD(result1.want))<parseFloat(doc[0].wantAmount.slice(0,-5))) {
                Trade.findOneAndUpdate({orderID: doc[n].orderID}, {
                  $set: {status: 'filling', wantAmountNow: result1.want}}, {useFindAndModify: false}, function (err, doc) {
                  if (err) return handleError(err);
                });
              }
            });
          }
        }); 
      }
    });
    
  }

  web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
    if (!error) { 
      current_new_block = new_block.number
      Trade.findOne().sort({number: -1}).exec(async function (err, db_block) {
        if (db_block == null)  db_block = {number: cursor}
        Trade.deleteMany({number: {$lte: db_block.number - 10}, status: 'false'}, function (err, res) {
          if (err) console.log(err)
        })
        // console.log('New block', current_new_block, new_block.number, scanning_old_blocks)
        if (db_block.number < new_block.number - 7) {
          if (scanning_old_blocks == 1) {
            Trade.deleteMany({number: {$gte: db_block.number - 10}}, function (err, res) {
              if (err) console.log(err)
              scanOldBlock()
              scanning_old_blocks++
            })
          } else scanning_old_blocks++
        } else {
          console.log('else')
          scanning_old_blocks = 1
          await scanBlock(new_block.number - 6)
        }
      })
    }
  })

  async function scanOldBlock() {
    // console.log(current_new_block)
    Trade.findOne().sort({number: -1}).exec(async function (err, db_block) {
      if (db_block == null) db_block = {number: cursor}
      Trade.deleteMany({number: {$lte: db_block.number - 1000},status: 'false'}, function (err, res) {
        if (err) console.log(err)
      })
      array.splice(0, 100)
      if (db_block.number < current_new_block - 7) {
        let _from_block = Math.max(db_block.number, cursor)
        let _to_block = Math.min(current_new_block - 6, db_block.number + 5)
        // console.log('db ' , db_block.number, 'new ' , current_new_block, 'from ' , _from_block,'to ' , _to_block)
        for (let i = _from_block + 1; i <= _to_block; i++) 
        array.push(i)
        processArray(array)
      }
    })
  }
  async function processArray(array) {
    // map array to promises
    const promises = array.map(scanBlock);
    // wait until all promises are resolved
    await Promise.all(promises);
    // console.log('Done!');
    scanOldBlock()
  }
  // async function processArray(array) {
  //   for (const i of array) {
  //     await scanBlock(i);
  //   }
  //   // console.log('Done!');
  //   scanOldBlock()
  // }
  res.send('collecting...')
}

module.exports.block = async function (req, res) {
  let cursor = 26500000
  scanBlock = async (_from_block, _to_block) => {
    let e1 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Propose', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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
                time: result1.timestamp
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    let e2 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Unlock', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e3 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Slash', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e4 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Revoke', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e5 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Preemptive', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e6 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Absorption', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e7 = new Promise((resolve, reject) => {
      Seigniorage.getPastEvents('Stop', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e8 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Transfer', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToNUSD(eventparam[2]) + ' NewSD',
                },
                time: result1.timestamp
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    let e9 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Transfer', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              'indexed': true,
              'name': '_from',
              'type': 'address'
            },
            {
              'indexed': true,
              'name': '_to',
              'type': 'address'
            },
            {
              'indexed': false,
              'name': '_value',
              'type': 'uint256'
            },
            {
              'indexed': false,
              'name': '_data',
              'type': 'bytes'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
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
                time: result1.timestamp
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    let e10 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('OwnershipTransferred', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e11 = new Promise((resolve, reject) => {
      StableToken.getPastEvents('Approval', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e12 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Transfer', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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
              let data = {
                status: true,
                number: result['0'].blockNumber,
                name: 'Event: Transfer',
                event: {
                  param1: 'Address: ' + eventparam[0],
                  param2: 'To: ' + eventparam[1],
                  param3: 'Value: ' + weiToMNTY(eventparam[2]) + ' MNTY',
                },
                time: result1.timestamp
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    let e13 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Transfer', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
        if (result['0'] !== undefined) {
          let eventparam = web3.eth.abi.decodeLog([{
              'indexed': true,
              'name': '_from',
              'type': 'address'
            },
            {
              'indexed': true,
              'name': '_to',
              'type': 'address'
            },
            {
              'indexed': false,
              'name': '_value',
              'type': 'uint256'
            },
            {
              'indexed': false,
              'name': '_data',
              'type': 'bytes'
            }
          ], result['0'].raw.data, result['0'].raw.topics)
          web3.eth.getBlock(result['0'].blockNumber, async function (error, result1) {
            if (!error) {
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
                time: result1.timestamp
              }
              resolve(data)
            }
          })
        } else {
          resolve(null)
        }
      })
    })

    let e14 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('OwnershipTransferred', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    let e15 = new Promise((resolve, reject) => {
      VolatileToken.getPastEvents('Approval', {fromBlock: _from_block, toBlock: _to_block}, async function (error, result) {
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

    Promise.all([e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15])
      .then(data => {
        if (data[0] == null && data[1] == null && data[2] == null && data[3] == null && data[4] == null && data[5] == null && data[6] == null && data[7] == null && data[8] == null && data[9] == null && data[10] == null && data[11] == null && data[12] == null && data[13] == null && data[14] == null) {
          Data.create({status: false,number: _to_block}, function (err) {
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

  web3.eth.subscribe('newBlockHeaders', function (error, new_block) {
    if (!error) {
      Data.findOne().sort({number: -1}).exec(async function (err, db_block) {
        if (db_block == null) db_block = {number: cursor}
        Data.deleteMany({number: {$lte: db_block.number - 1000},status: false}, function (err, res) {
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
  res.send('collecting...')
}

module.exports.show = async function (req, res) {
  let show = await Data.find({status: true,}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.preemptive = async function (req, res) {
  let show = await Data.find({status: true,Event: 'Preemptive'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.propose = async function (req, res) {
  let show = await Data.find({status: true,name: 'Event: Propose'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.transfer = async function (req, res) {
  let show = await Data.find({status: true,name: 'Event: Transfer'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.absorption = async function (req, res) {
  let show = await Data.find({status: true,name: 'Event: Absorption'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.slash = async function (req, res) {
  let show = await Data.find({status: true,name: 'Event: Slash'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.approval = async function (req, res) {
  let show = await Data.find({status: true,name: 'Event: Approval'}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.clear = async function (req, res) {
  Data.deleteMany({}, function (err, res) {
    if (err) console.log(err)
  })
  res.send('da xoa DB')
}

module.exports.gettoptrade = async function (req, res) {
  let show = await Trade.find({status: 'order'}).limit(40).sort({blockNumber: -1})
  res.json(show)
}

module.exports.alltrade = async function (req, res) {
  let show = await Trade.find().sort({blockNumber: -1})
  res.json(show)
}

module.exports.getopenorder = async function (req, res) {
  const queryObject = url.parse(req.url, true).query;
  let address = queryObject.address
  let from = parseInt(queryObject.from)
  let to = parseInt(queryObject.to)
  let show = await Trade.find({$or: [{status: 'order'}, {status: 'filling'}],address: address,time: {$gte: from, $lte: to}}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.getopenhistory = async function (req, res) {
  const queryObject = url.parse(req.url, true).query;
  let address = queryObject.address
  let from = parseInt(queryObject.from)
  let to = parseInt(queryObject.to)
  let show = await Trade.find({$or: [{status: 'canceled'}, {status: 'filled'}, {status: 'order'}],address: address,time: {$gte: from, $lte: to}}).sort({blockNumber: -1})
  res.json(show)
}

module.exports.gettradehistory = async function (req, res) {
  const queryObject = url.parse(req.url, true).query;
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
  let show = await Candle.find({}).sort({time: 1})
  res.json(show)
}

module.exports.getcandle30 = async function (req, res) {
  let result = []
  function getCandle (from) {
    let to = from + 1800
    Candle.countDocuments({}).exec(async function (err, doc) {
      if (err) return handleError(err)
      let count = Math.floor(doc/2)
      console.log(result.length, count)
      Candle.find({time: {$gte: from, $lt: to}}).exec(function (err, doc1) {
        if (err) return handleError(err)
        console.log(doc1.length, result.length, count)
        if(doc1.length > 1 && result.length < count) {
          let array = []
          for (let i = 0; i < 2 ; i++) array.push(doc1[i].top, doc1[i].bot)
          let data = {
            top : Math.max.apply(Math, array),
            bot : Math.min.apply(Math, array),
            open : doc1[0].open,
            close : doc1[1].close,
            time: doc1[0].time
          }
          result.push(data)
          getCandle(to)
          console.log(result)
        } else {
          console.log('else')
          let show = result
          console.log('show', show)
          res.json(show)
        }
      })
    })
  }  
  Candle.findOne({}).sort({time: 1}).exec(function (err, doc) {
    if (err) return handleError(err)
    getCandle(doc.time)
  })
}

module.exports.getcandle60 = async function (req, res) {
  let result = []
  function getCandle (from) {
    let to = from + 3600
    Candle.countDocuments({}).exec(async function (err, doc) {
      if (err) return handleError(err)
      let count = Math.floor(doc/4)
      console.log(result.length, count)
      Candle.find({time: {$gte: from, $lt: to}}).exec(function (err, doc1) {
        if (err) return handleError(err)
        console.log(doc1.length, result.length, count)
        if(doc1.length > 1 && result.length < count) {
          let array = []
          for (let i = 0; i < 4 ; i++) array.push(doc1[i].top, doc1[i].bot)
          let data = {
            top : Math.max.apply(Math, array),
            bot : Math.min.apply(Math, array),
            open : doc1[0].open,
            close : doc1[3].close,
            time: doc1[0].time
          }
          result.push(data)
          getCandle(to)
          console.log(result)
        } else {
          console.log('else')
          let show = result
          console.log('show', show)
          res.json(show)
        }
      })
    })
  }  
  Candle.findOne({}).sort({time: 1}).exec(function (err, doc) {
    if (err) return handleError(err)
    getCandle(doc.time)
  })
}

module.exports.getcandle1 = async function (req, res) {
  let result = []
  function getCandle (from) {
    let to = from + 864000
    Candle.countDocuments({}).exec(async function (err, doc) {
      if (err) return handleError(err)
      let count = Math.floor(doc/96)
      console.log(result.length, count)
      Candle.find({time: {$gte: from, $lt: to}}).exec(function (err, doc1) {
        if (err) return handleError(err)
        console.log(doc1.length, result.length, count)
        if(doc1.length > 1 && result.length < count) {
          let array = []
          for (let i = 0; i < 96 ; i++) array.push(doc1[i].top, doc1[i].bot)
          let data = {
            top : Math.max.apply(Math, array),
            bot : Math.min.apply(Math, array),
            open : doc1[0].open,
            close : doc1[95].close,
            time: doc1[0].time
          }
          result.push(data)
          getCandle(to)
          console.log(result)
        } else {
          console.log('else')
          let show = result
          console.log('show', show)
          res.json(show)
        }
      })
    })
  }  
  Candle.findOne({}).sort({time: 1}).exec(function (err, doc) {
    if (err) return handleError(err)
    getCandle(doc.time)
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
