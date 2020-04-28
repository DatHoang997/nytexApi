var mongoose = require('mongoose')

let candleSchema = new mongoose.Schema({
    open: Number,
    close: Number,
    top: Number,
    bot: Number,
    time: Number
})

var Candle = mongoose.model('Candle', candleSchema, 'candle')

module.exports = Candle;