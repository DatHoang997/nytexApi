var mongoose = require('mongoose');

let blockSchema = new mongoose.Schema({
    BlockNumber: String,
});

var Block = mongoose.model('Block', blockSchema, 'block')

module.exports = Block;