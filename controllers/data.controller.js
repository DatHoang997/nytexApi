const url = require('url')
let Data = require('../models/data.model')
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
            }], result['0'].raw.data, result['0'].raw.topics)
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
            }], result['0'].raw.data, result['0'].raw.topics)
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
            }], result['0'].raw.data, result['0'].raw.topics)
          let data = {
            status: true,
            number: result['0'].blockNumber,
            name: 'Event: OwnershipTransferred',
            event: {
              param1: 'previousOwner: ' + eventparam[0],
              param2: 'newOwner: ' + eventparam[1]
            }
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
            }], result['0'].raw.data, result['0'].raw.topics)
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

    Promise.all([e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11, e12, e13, e14, e15]).then(data => {
      if (data[0] == null && data[1] == null && data[2] == null && data[3] == null && data[4] == null && data[5] == null && data[6] == null && data[7] == null && data[8] == null && data[9] == null && data[10] == null && data[11] == null && data[12] == null && data[13] == null && data[14] == null) {
        Data.create({status: false,number: _to_block}, function (err) {
          if (err) console.log(err)
        })
      } else {
        for (let i = 0; i <= data.length - 1; i++) {
          if (data[i] != null) {
            Data.create(data[i], function (err) {
              if (err) console.log(err)
            })
          }
        }
      }
    }, reason => {
      console.log(reason)
    })
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
      Candle.find({}).limit(1440).sort({time: -1}).exec(function (err, doc) {
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
      Candle.find({}).limit(2880).sort({time: -1}).exec(function (err, doc) {
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
      Trade.find({status: 'filled', filledTime: {$gte: t-86400, $lte: t}}).sort({filledTime: 1}).exec(function (err, doc1) {
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
              percent: printPersent
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
              percent: printPersent
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
        percent: 0 + '%'
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

module.exports.a = async function (req, res) {
  Trade.findOneAndUpdate({number: 28248968}, {$set: {price: '0.00008'}}, {useFindAndModify: false}, function (err, doc) {
    if (err) console.log(err)
  })
  Trade.findOneAndUpdate({number: 28811797}, {$set: {status: 'canceled'}}, {useFindAndModify: false}, function (err, doc) {
    if (err) console.log(err)
  })
  res.send('da xoa DB')
}
