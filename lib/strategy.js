var parse = require('./profile').parse
  , uri = require('url')
  , util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;

/**
 * Creates an instance of 'OAuth2Strategy'.
 *
 * The OAuth 2.0 authentiation strategy authentiates request by delegating to Venmo using the OAuth 2.0
 * protocol.
 *
 * Applications must supply a 'verify' callback which takes an 'accessToken', 'refreshToken', and a Venmo object,
 * which contains information about the authorized user. In the example below, the 'verify' callback verifies
 * whether or not a user has already created an account for your application based on the credentials
 * provided by the Venmo object.
 *
 * The 'verify' callback will then call the 'done' callback supplying a 'user' and an 'err' (error). 'user'
 * should be set to 'false' if the credentials in the Venmo object are not valid. If an exception occured, 'err'
 * should be set.
 *
 * Options:
 *   -'clientID' your Venmo applicatio's client ID
 *   -'clientSecret' your Venmo application's client Secret
 *   -'callbackURL' URL to which Venmo will redirect the user after granting authorization
 *
 *   Both the clientID and the clientSecret can be found on the developer tab on the user page on Venmo.
 *   You must create an account on Venmo and create a new app within the developer tab if you have not
 *   already done so. *** Make sure your callbackURL is the same the 'Web Redirect URL' in the developer tab.
 *
 *
 *
 *
 * Example:
 *
 * VenmoStrategy = require('passport-venmo').Strategy;
 *
 *     ...
 *
 *     passport.use(new VenmoStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/venmo/callback'
 *       },
 *       function(accessToken, refreshToken, venmo, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * ## If you are using MongoDB and MongooseJS:
 * ## You must set up the User model using mongoose and mongo separately.
 * ## http://mongoosejs.com/index.html
 *
 * var mongoose = require('mongoose');
 * var User = mongoose.model('User');
 *
 * passport.use(new VenmoStrategy({
 *     clientID: your_clientID,
 *     clientSecret: your_clientSecret,
 *     callbackURL: your_callbackURL
 *   },
 * function(accessToken, refreshToken, venmo, done){
 *   User.findOne({
 *   'venmo.id': profile.id
 *   }, function(err, user){
 *     if(err){
 *       return done(err);
 *     }
 *     if(!user){
 *       user = new User({
 *         name: venmo.displayName,
 *         username: venmo.username,
 *         email: venmo.email,
 *         provider: 'venmo'
 *         venmo: venmo._json,
 *         balance: venmo.balance,
 *         access_token: accessToken,
 *         refresh_token: refreshToken,
 *       });
 *       user.save(function(err){
 *         if(err) console.log(err);
 *         return done(err, user);
 *       });
 *     } else{
 *       user.balance = venmo.balance;
 *       user.access_token = accessToken;
 *       user.save();
 *       return done(err, user);
 *     }
 *   });
 * }
 *));
 *
 * It is a good idea to store the access_token somewhere as further requests
 * to make payments or obtain data on a user's Venmo friend list will require that
 * user's access_token.

 * It is also a good idea to store the refresh_token so that your application can automatically
 * refresh the access_token for the user without having to log into Venmo again.
 *
 *
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
*/


function Strategy(options, verify){
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://api.venmo.com/v1/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://api.venmo.com/v1/oauth/access_token';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'venmo';
  this._profileURL = options.profileURL || 'https://api.venmo.com/v1/me';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);



/**
 * Authenticate request by delegating to a service provider using OAuth 2.0.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {

  // When a user denies access to your app, venmo redirects to a url containing
  // an 'error' query parameter describing the error:
  // https://myexampleapp.com/oauth?error=user+denied+access
  if (req.query && req.query.error) {
    return this.fail();
  }

  // Call the base class for standard OAuth2 authentication.
  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};



/**
 * Return extra Venmo-specific parameters to be included in the user
 * authorization request.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function(options){
  var params = {};
  if(options.client_id)
    params.client_id = options.client_id;
  if(options.scope)
    params.scope = options.scope;
  if(options.state)
    params.state = options.state;
  if(options.callbackURL)
    params.callbackURL = options.callbackURL;
  return params
}

/**
 * Retrieve user profile from Venmo.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `venmo`
 *   - `id`               the user's Venmo ID
 *   - `username`         the user's Venmo username
 *   - `displayName`      the user's full name
 *   - 'email'            the user's email
 *   - 'phone'            the user's phone number
 *   - 'balance'          the user's current balance on Venmo
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {

  this._oauth2.get(this._profileURL, accessToken, function (err, body, res) {
    var json;

    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (_) {}
      }
      if (json && json.errors && json.errors.length) {
        var e = json.errors[0];
        return done(new APIError(e.message, e.code));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = parse(json); //this is required at the top of the file
    profile.provider = 'venmo';
    profile._raw = body;
    profile._json = json.data.user;

    done(null, profile);
  });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
