/**
 * Module dependencies.
 */
// var Venmo = require('venmo');
// var venmo = new Venmo(client_id, client_secret);
var User = require('../models/user.js')["User"];


exports.index = function(req, res){
  res.render('index', {user: req.user ? JSON.stringify(req.user) : 'null'});
};
/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
  res.render('payment', {user: req.user ? JSON.stringify(req.user) : 'null'});
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};

exports.receipt = function(req, res) {
  console.log(req.body);
  res.render('success', {user: req.user ? JSON.stringify(req.user) : 'null'});
}
