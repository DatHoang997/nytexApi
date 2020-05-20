var mongoose = require('mongoose');

let tradeSchema = new mongoose.Schema({
    status: String,
    address: String,
    to: String,
    haveAmount: String,
    wantAmount: String,
    price: String,
    wantAmountNow: String,
    number: Number,
    orderID : {type: String, unique: true},
    time: Number,
    filledTime: Number
});

var Trade = mongoose.model('Trade', tradeSchema, 'trade')

module.exports = Trade;