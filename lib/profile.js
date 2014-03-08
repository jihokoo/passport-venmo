/**
 * Parse venmo object.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */

exports.parse = function(json){

  if('string' == typeof json) json = JSON.parse(json);

  var venmo = {};

  venmo.id = json.data.user.id;
  venmo.username = json.data.user.username;
  venmo.displayName = json.data.user.display_name;

  if(json.data.balance) venmo.balance = json.data.balance;
  if(json.data.user.email) venmo.email = json.data.user.email;
  if(json.data.user.phone) venmo.phone = json.data.user.phone;

  return venmo;
}
