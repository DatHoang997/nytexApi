var mongoose = require('mongoose')

let volumeSchema = new mongoose.Schema({
    open: Number,
    close: Number,
    top: Number,
    bot: Number,
    time: Number
})

var Volume = mongoose.model('Volume', volumeSchema, 'volume')

module.exports = Volume;