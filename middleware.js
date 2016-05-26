"use strict";

const db = require("./db");
const _ = require("lodash");
const pre = require("./presenter");

exports.ensureAuth = function*(next) {
	const response = {
		"success": false,
		"error": {
			"message": "You are not authorized."
		}
	}

	const sessionId = this.session.sessionId || false;
	if(sessionId) {
		const session = yield db.getSessionById(sessionId);
		if(session) {
			const user = yield db.getUserByUserId(session.user_id);
		    if (user) {
		      	this.currUser = pre.presentUser(user);
		      	this.currSessionId = sessionId;
		      	yield* next;
		      	return;
		    }
		}
	}

	let urlList = [
 		"/api/login",
 		"/api/login/",
 		"/api/register",
 		"/api/register/"
 	];
 
 	// check if url target is on the urlList
 	if(_.includes(urlList, this.path)) {
 		yield* next;
 		return;
 	}

	this.session = null
	this.type = "json";
	this.body = response;
	return;
};

// Assoc ctx.currUser if the session_id cookie (a UUID v4)
// is an active session.
exports.wrapCurrUser = function *(next) {
    const sessionId = this.cookies.get('session_id');
    debug('[wrapCurrUser] session_id: ' + sessionId);
    if (!sessionId) return yield next;
    const user = yield db.getUserBySessionId(sessionId);
    if (user) {
      this.currUser = pre.presentUser(user);
      this.currSessionId = sessionId;
      debug('[wrapCurrUser] User found');
    } else {
      debug('[wrapCurrUser] No user found');
    }
    yield* next;
};
