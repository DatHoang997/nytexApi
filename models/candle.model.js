var mongoose = require('mongoose')

let candleSchema = new mongoose.Schema({
    open: Number,
    close: Number,
    hight: Number,
    low: Number,
    volumeMNTY: Number,
    volumeNewSD: Number,
    time: Number
})

var Candle = mongoose.model('Candle', candleSchema, 'candle')

module.exports = Candle;