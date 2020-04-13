var mongoose = require('mongoose');

let tradeSchema = new mongoose.Schema({
    status: String,
    address: String,
    to: String,
    haveAmount: String,
    wantAmount: String,
    haveAmountnow: String,
    wantAmountnow: String,
    number: Number,
    orderID : String,
    time: String
});

var Trade = mongoose.model('Trade', tradeSchema, 'trade')

module.exports = Trade;