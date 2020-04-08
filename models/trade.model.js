var mongoose = require('mongoose');

let tradeSchema = new mongoose.Schema({
    status: false,
    index: String,
    address: String,
    to: String,
    haveAmount: String,
    wantAnount: String,
    number: Number,
    time: String
});

var Trade = mongoose.model('Trade', tradeSchema, 'trade')

module.exports = Trade;