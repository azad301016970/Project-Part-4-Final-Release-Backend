var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
  });
  

module.exports = mongoose.model('users', userSchema);