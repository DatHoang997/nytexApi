var Data = require('../models/data.model')
var Trade = require('../models/trade.model')
var Web3 = require('web3');
var SeigniorageABI = require('../JSON/Seigniorage.json')
var StableTokenABI = require('../JSON/StableToken.json')
var VolatileTokenABI = require('../JSON/VolatileToken.json')

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
  var cursor = 31955000
  scanBlock = async (_from_block, _to_block) => {
    for (let i = _from_block; i < _to_block; i++) {
      Trade.create({
        number: i
      }, function (err) {
        if (err) return handleError(err);
      });
      web3.eth.getBlock(i, true, function (error, result) {
        if (!error) {
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

              if (id === "7ca3c7c7") { //trade( index bytes32,uint256,uint256,bytes32)
                var decode = web3.eth.abi.decodeParameters(['bytes32', 'uint256', 'uint256', 'bytes32'], para);
                if (e.to == 0x0000000000000000000000000000000000034567) {
                  Trade.create({
                    status: true,
                    index: decode["0"],
                    address: e.from,
                    to: e.to,
                    haveAmount: weiToMNTY(decode["1"]) + ' MNTY',
                    wantAnount: weiToNUSD(decode["2"]) + ' NewSD',
                    number: result.number,
                    time: formattedTime,
                  }, function (err) {
                    if (err) return handleError(err);
                  });
                }
                if (e.to == 0x0000000000000000000000000000000000045678) {
                  Trade.create({
                    status: true,
                    index: decode["0"],
                    address: e.from,
                    to: e.to,
                    haveAmount: weiToNUSD(decode["1"]) + ' NewSD',
                    wantAnount: weiToMNTY(decode["2"]) + ' MNTY',
                    number: result.number,
                    time: formattedTime,
                  }, function (err) {
                    if (err) return handleError(err);
                  });
                }
              } else if (id == "f318722b") { //calcOrderID(address,bytes32)
                var decode = web3.eth.abi.decodeParameters(['address', 'bytes32'], para);

              } else if (id == "43271d79") { //cancel(bool, ID bytes32)
                var decode = web3.eth.abi.decodeParameters(['bool', 'bytes32'], para);

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
          console.log('alalal')
          await scanBlock(new_block.number - 6, new_block.number - 6)
        }
      })
    }
  })

}
