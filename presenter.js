'use strict';

// 3rd party
const _ = require('lodash');

////////////////////////////////////////////////////////////

exports.presentUser = function(user) {
  	// Fix embedded json representation
  	if (_.isString(user.created_at))
    user.created_at = new Date(user.created_at);

  	return user;
};