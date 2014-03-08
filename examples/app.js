
/**
 * Module dependencies.
 */
var passport = require('passport');
var VenmoStrategy = require('passport-venmo').Strategy;
var request = require('request')
var express = require('express');
var swig = require('swig');
var users_controller = require('./app/controllers/users.js');
var http = require('http');
var path = require('path');
var app = express();
app.engine("html", swig.renderFile);
var MongoStore = require('connect-mongo')(express);

// *************************************************************

// To get the clientID and the clientSecret you must log in to Venmo
// go to the developer tab on the user page and create a new app.
// You will be prompted to specify your callback url, however, they
// call it your Web Redirect URL

var Venmo_Client_ID = "--insert your venmo clientId here--";
var Venmo_Client_SECRET = '--insert venmo clientSecret here--';
var Venmo_Callback_URL = 'http://localhost:3000/auth/venmo/callback';
// Keep the Venmo_Callback_URL as is for the purposes of this example.

// *************************************************************



var User = require('./app/models/user.js')["User"];


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'html');
app.use(express.favicon(__dirname + '/public/images/venmo.png'));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the VenmoStrategy
// Strategies in Passport require a 'verify' function, which
// is the anonymous function we define as the second parameter
// of passport.use
// The 'verify' function accepts an accessToken, refreshToken,
// a 'venmo' object containing an authorized user's information
// and invoke callback function with the user object.
passport.use(new VenmoStrategy({
    clientID: Venmo_Client_ID,
    clientSecret: Venmo_Client_SECRET,
    callbackURL: Venmo_Callback_URL
  },
  function(accessToken, refreshToken, venmo, done) {
    User.findOne({
        'venmo.id': venmo.id
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        // checks if the user has been already been created, if not
        // we create a new instance of the User model
        if (!user) {
            user = new User({
                name: venmo.displayName,
                username: venmo.username,
                email: venmo.email,
                provider: 'venmo',
                venmo: venmo._json,
                balance: venmo.balance,
                access_token: accessToken,
                refresh_token: refreshToken
            });
            user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
            });
        } else {
            user.balance = venmo.balance;
            user.access_token = accessToken;
            user.save();
            user.venmo = venmo._json
            return done(err, user);
        }
    });
  }
));


app.get('/', users_controller.index);

app.get('/auth/venmo', passport.authenticate('venmo', {
    scope: ['make_payments', 'access_feed', 'access_profile', 'access_email', 'access_phone', 'access_balance', 'access_friends'],
    failureRedirect: '/'
}), users_controller.signin);

app.get('/auth/venmo/callback', passport.authenticate('venmo', {
    failureRedirect: '/'
}), users_controller.authCallback);

app.post('/auth/venmo/payment', function(req, res){
    //using the request library with a callback
    request.post('https://api.venmo.com/v1/payments', {form: req.body}, function(e, r, venmo_receipt){
        // parsing the returned JSON string into an object
        var venmo_receipt = JSON.parse(venmo_receipt);
        res.render('success', {venmo_receipt: venmo_receipt});
    });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
