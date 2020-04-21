var mongoose = require('mongoose');

let tradeSchema = new mongoose.Schema({
    status: String,
    address: String,
    to: String,
    haveAmount: String,
    wantAmount: String,
    haveAmountNow: String,
    wantAmountNow: String,
    number: Number,
    orderID : String,
    time: Number
});

var Trade = mongoose.model('Trade', tradeSchema, 'trade')

module.exports = Trade;