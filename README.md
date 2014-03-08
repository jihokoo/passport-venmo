# Passport-Venmo-OAuth

[Passport](http://passportjs.org/) strategies for authenticating with [Venmo](http://www.venmo.com/)
using OAuth 2.0.

This module lets you authenticate using Venmo in your Node.js applications.
By plugging into Passport, Venmo authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-venmo


## Usage of OAuth 2.0

#### Configure Strategy

The Venmo OAuth 2.0 authentication strategy authenticates users using a Venmo
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a `clientID`, `clientSecret`, and `callbackURL`.

    var VenmoStrategy = require('passport-venmo').Strategy;

    passport.use(new VenmoStrategy({
        clientID: Venmo_CLIENT_ID,
        clientSecret: Venmo_CLIENT_SECRET,
        callbackURL: "http://127.0.0.1:3000/auth/venmo/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ VenmoId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'venmo'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/venmo',
      passport.authenticate('venmo'));

    app.get('/auth/venmo/callback',
      passport.authenticate('venmo', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

## Scope

By default, upon making a `HTTP GET` request to:
application:
    https://api.venmo.com/v1/me?access_token=token_goes_here

Venmo will return a `JSON` response

For example:

    {
      "data":{
        "balance": null,
        "user":{
           "username":"jihokoo",
           "first_name":"Ji Ho",
           "last_name":"Koo",
           "display_name":"Ji Ho Koo",
           "is_friend":false,
           "friends_count":100,
           "about":"So happy!",
           "email":null,
           "phone":null,
           "profile_picture_url":"https://venmopics.appspot.com/u/v3/s/some_id",
           "id":"user's_venmo_id",
           "date_joined":"2013-02-10T21:58:05"
        }
      }
    };

The balance, email, and phone fields are 'null'. Venmo requires developers to specify that their applications require this informations in scopes.

For example:

    app.get('/auth/venmo', passport.authenticate('venmo', {scope: ['access_balance', 'access_phone', 'access_email']}));

If you intend on making payments on a user's behalf, the `make_payments` scope must be specified as shown above. Scroll to the bottom of this [page](https://developer.venmo.com/docs/authentication) to see the full list of scopes.

## Examples

- For a complete, working example, refer to the [login and pay example](https://github.com/jihokoo/passport-venmo/tree/master/examples)
- Example uses MongoDB, make sure you run mongod in the background


## Credits

  - [Ji Ho Koo](http://github.com/jihokoo)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2013-2014
