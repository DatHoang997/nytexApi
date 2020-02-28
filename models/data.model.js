var mongoose = require('mongoose');

let dataSchema = new mongoose.Schema({
    status: Boolean,
    event: String,
    function: String,
    blockNumber: String,
    log_id: String,
});

var Data = mongoose.model('Data', dataSchema, 'data')

module.exports = Data;