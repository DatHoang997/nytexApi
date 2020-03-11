var mongoose = require('mongoose');

let dataSchema = new mongoose.Schema({
    status: Boolean,
    number: Number,
    event: {
        name: String,
        param1: String,
        param2: String,
        param3: String,
        param4: String,
        param5: String
    },
    blockNumber: Number,
    time: String
});

var Data = mongoose.model('Data', dataSchema, 'data')

module.exports = Data;