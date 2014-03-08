'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/venmo-example');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("mongoose connection is open")
});

var Schema = mongoose.Schema,
    crypto = require('crypto');

/**
 * User Schema
 */
var UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: String,
    username: {
        type: String,
        unique: true
    },
    balance: String,
    provider: String,
    salt: String,
    venmo: {},
    access_token: String,
    refresh_token: String
});

var User = mongoose.model('User', UserSchema);

module.exports = {"User": User};
