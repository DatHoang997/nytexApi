var mongoose = require('mongoose');

let blockSchema = new mongoose.Schema({
    number: String
});

var Block = mongoose.model('Block', blockSchema, 'block')

module.exports = Block;