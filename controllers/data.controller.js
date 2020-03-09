var Data = require('../models/data.model')
var Block = require('../models/block.model')
var Web3 = require('web3');
var SeigniorageABI = require('../JSON/Seigniorage.json')
var StableTokenABI = require('../JSON/StableToken.json')
var VolatileTokenABI = require('../JSON/VolatileToken.json')

const { cutString, thousands, weiToNTY, weiToMNTY, weiToNUSD, mntyToWei, nusdToWei, decShift } = require ('../util/help')
const Help = require('../util/help')

const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ws.nexty.io"))

let Seigniorage = new web3.eth.Contract(SeigniorageABI, '0x0000000000000000000000000000000000023456');
let StableToken = new web3.eth.Contract(StableTokenABI, '0x0000000000000000000000000000000000045678');
let VolatileToken = new web3.eth.Contract(VolatileTokenABI, '0x0000000000000000000000000000000000034567');

module.exports.data = async function (req, res) {

}

module.exports.block = async function (req, res) {
  var cursor = 28000000
  scanBlock = async (_from_block, _to_block) => {
    var insert = (data) => {
      Data.create(data, function (err) {
        if (err) return handleError(err);
      });
    }

    Seigniorage.getPastEvents('Propose', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
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
        let elog = {
          name: 'Event: Propose',
          param1 : 'Maker: '+eventparam[0],
          param2 : 'Amount: '+weiToNUSD(eventparam[1])+' NewSD',
          param3 : 'Stake: '+weiToMNTY(eventparam[2])+' MNTY',
          param4 : 'LockdownExpiration: '+eventparam[3],
          param5 : 'SlashingRate: '+eventparam[4]
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })


    Seigniorage.getPastEvents('Unlock', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          type: 'address',
          name: 'maker',
          indexed: true
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Unlock',
          param1 : 'Address : '+eventparam[0],
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    Seigniorage.getPastEvents('Slash', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          type: 'address',
          name: 'maker',
          indexed: true
        }, {
          type: 'uint256',
          name: 'amount',
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Slash',
          param1 : 'Address: '+eventparam[0],
          param2 : 'Amount: '+weiToMNTY(eventparam[1])+ ' MNTY',
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    Seigniorage.getPastEvents('Revoke', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          type: 'address',
          name: 'maker',
          indexed: true
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Slash',
          param1 : 'Address: '+eventparam[0],
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    Seigniorage.getPastEvents('Preemptive', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
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
        let elog = {
          name: 'Event: Preemptive',
          param1 : 'Maker: '+eventparam[0],
          param2 : 'Stake: '+weiToMNTY(eventparam[1])+' MNTY',
          param3 : 'LockdownExpiration: '+eventparam[2],
          param4 : 'UnlockNumber: '+eventparam[3],
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    Seigniorage.getPastEvents('Absorption', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
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
        let elog = {
          name: 'Event: Absorption',
          param1 : 'Amount: '+weiToNTY(eventparam[0])+' NTY',
          param2 : 'Supply: '+eventparam[1],
          param3 : 'Emptive: '+eventparam[2],
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    Seigniorage.getPastEvents('Stop', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Stop()',
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    StableToken.getPastEvents('Transfer', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
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
        let elog = {
          name: 'Event: Transfer',
          param1 : 'Address: '+eventparam[0],
          param2 : 'To: '+eventparam[1],
          param3 : 'Value: '+weiToNUSD(eventparam[2])+' NewSD',
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    StableToken.getPastEvents('OwnershipTransferred', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          indexed : true,
          name : 'previousOwner',
          type: 'address'
        },
        {
          indexed : true,
          name : 'newOwner',
          type: 'address'
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: OwnershipTransferred',
          param1 : 'previousOwner: '+eventparam[0],
          param2 : 'newOwner: '+eventparam[1]
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    StableToken.getPastEvents('Approval', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          indexed : true,
          name : 'owner',
          type: 'address'
        },
        {
          indexed : true,
          name : 'spender',
          type : 'address'
        },
        {
          indexed : false,
          name : 'value',
          type : 'uint256'
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Approval',
          param1 : 'Owner: '+eventparam[0],
          param2 : 'Spender: '+eventparam[1],
          param2 : 'Value: '+weiToNUSD(eventparam[2])+' NewSD'
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    VolatileToken.getPastEvents('OwnershipTransferred', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          indexed : true,
          name : 'previousOwner',
          type: 'address'
        },
        {
          indexed : true,
          name : 'newOwner',
          type: 'address'
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: OwnershipTransferred',
          param1 : 'previousOwner: '+eventparam[0],
          param2 : 'newOwner: '+eventparam[1]
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    VolatileToken.getPastEvents('Approval', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
      if (result['0'] !== undefined) {
        let eventparam = web3.eth.abi.decodeLog([{
          indexed : true,
          name : 'owner',
          type: 'address'
        },
        {
          indexed : true,
          name : 'spender',
          type : 'address'
        },
        {
          indexed : false,
          name : 'value',
          type : 'uint256'
        }], result['0'].raw.data, result['0'].raw.topics)
        let elog = {
          name: 'Event: Approval',
          param1 : 'Owner: '+eventparam[0],
          param2 : 'Spender: '+eventparam[1],
          param2 : 'Value: '+weiToMNTY(eventparam[2])+' MNTY'
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })

    VolatileToken.getPastEvents('Transfer', {
      fromBlock: _from_block,
      toBlock: _to_block
    }, function (error, result) {
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
        let elog = {
          name: 'Event: Transfer',
          param1 : 'Address: '+eventparam[0],
          param2 : 'To: '+eventparam[1],
          param3 : 'Value: '+weiToMNTY(eventparam[2])+' MNTY',
        }
        let data = {
          status: true,
          blockNumber: result['0'].blockNumber,
          event: elog
        }
        insert(data)
      }
    })
  }
  // scanBlock(28587300,28597378)

  web3.eth.subscribe('newBlockHeaders', async function (error, new_block) {
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
          }
        }, function (err, res) {
          if (err) console.log(err)
        })
        if (db_block.number < new_block.number) {
          let _from_block = Math.max(db_block.number, cursor)
          let _to_block = Math.min(new_block.number - 6, db_block.number + 100000)
          console.log(_from_block)
          console.log(_to_block)
          console.log("db " + db_block.number)
          console.log("new " + new_block.number)
          Data.create({
            number: _to_block
          }, function (err) {
            if (err) return handleError(err);
          });
          await scanBlock(_from_block + 1, _to_block)
        } else {
          await scanBlock(new_block.number - 6, new_block.number - 6)
        }
      })
    }
  })
}

module.exports.blockpost = async function (req, res) {

}

module.exports.get = async function (req, res) {
  res.render('block')
}

module.exports.show = async function (req, res) {
  var show = await Data.find({
    status: true
  }).sort({
    blockNumber: -1
  })
  res.json(show)
}


module.exports.post = async function (req, res) {
  console.log(req.body)
  let aaa = {
    blockNumber: req.body.BlockNumber
  }
  Block.create(req.body, function (err) {
    if (err) return handleError(err);
    // saved!
  });
  res.send('da luu thanh cong')

}
