var Data = require('../models/data.model')
var Block = require('../models/block.model')
var Web3 = require('web3');
var Events = require('../Mockup/Events');
var Items = require('../Mockup/Items');
var Accs = require('../Mockup/Accs');

module.exports.data = async function (req, res) {
  var show = await Data.find()
  res.json(show)
}

module.exports.block = async function(req, res) {  
  res.render('block')
}

module.exports.blockpost = async function(req, res) {  
  console.log(req.body)
  Block.create(req.body, function (err) {
    if (err) return handleError(err);
    // saved!
  });
}

module.exports.get = async function(req, res) {  
  res.render('block')
}

module.exports.show =async function(req, res) {  
  var show = await Data.find(req.query)
  res.json(show)
}

module.exports.post = async function (req, res) {
  console.log(req.body.BlockNumber)
  const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://ws.nexty.io"))

  query = async (insertNumber) => {
    for (let i = insertNumber; i <= insertNumber; i++) {
      Data.find({
        blockNumber: i
      }, function (err, docs) {
        if (docs == '') {
          web3.eth.getBlock(i, true, function (error, result) {
            if (!error) {
              if (result != null && result.transactions != null) {
                Items.forEach((item) => {
                  result.transactions.forEach(function (e) {
                    let id = e.input.slice(2, 10)
                    let para = '0x' + e.input.slice(11)
                    if (id !== "0x" && id === item.id) {
                      web3.eth.getTransactionReceipt(e.hash, function (err, receipt) {
                        if (!err && receipt.logs !== undefined && receipt.logs !== null) {
                          Events.forEach((event) => {
                            for (let n = 0; n <= receipt.logs.length - 1; n++) {
                              if (event.code === receipt.logs[n].topics[0]) {
                                let ecut = event.event.indexOf('(')
                                let ename = event.event.slice(0, ecut + 1)
                                let eventparam = web3.eth.abi.decodeLog(
                                  event.inputs,
                                  receipt.logs[n].data,
                                  receipt.logs[n].topics)
                                let elog = ename
                                for (let i = 0; i < event.inputs.length + 1; i++) {
                                  if (i > 0) {
                                    let temp = elog + event.inputs[i - 1].name + ": " + eventparam[i - 1] + ", ";
                                    elog = temp
                                  }
                                  if (i === event.inputs.length) {
                                    elog = elog + ')'
                                    elog = elog.replace(', )', ')')
                                    var strip_comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
                                    var argument_names = /([^\s,]+)/g
                                    var fnStr = item.function.replace(strip_comments, '')
                                    var parameters = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(argument_names)
                                    if (parameters === null)
                                      parameters = []
                                    let fcut = item.function.indexOf('(')
                                    let fname = item.function.slice(0, fcut + 1)
                                    let decode = web3.eth.abi.decodeParameters(parameters, para)
                                    Accs.forEach((acc) => {
                                      if (acc.address === e.from || acc.address === e.to) {
                                        let flog = acc.name + ' ' + fname
                                        for (let i = 0; i < parameters.length; i++) {
                                          if (i > 0) {
                                            flog += parameters[i] + ': ' + decode[i] + ", ";
                                          }
                                          if (i === parameters.length - 1) {
                                            flog = flog + ')'
                                            flog = flog.replace(', )', ')')
                                            let mydata = {
                                              status: true,
                                              event: elog,
                                              function: flog,
                                              blockNumber: receipt.blockNumber,
                                              log_id: receipt.logs[n].id,
                                            };
                                            Data.create(mydata, function (err) {
                                              if (err) return handleError(err);
                                              // saved!
                                            });
                                          }
                                        }
                                      }
                                    })
                                  }
                                }
                              }
                            }
                          })
                        }
                      })
                    }
                  })
                })
              }
            }
          })

        }
      })
    }
  }
  query(req.body.BlockNumber)

}

