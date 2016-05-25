"use strict";

const db = require("./db");
const _ = require("lodash");
const pre = require("./presenter");

exports.ensureAuth = function*(next) {
	const sessionId = this.session.sessionId || false;
	if(sessionId) {
		const session = yield db.getSessionById(sessionId);
		if(session) {
			const user = yield db.getUserByUserId(session.user_id);
		    if (user) {
		      	this.currUser = pre.presentUser(user);
		      	this.currSessionId = sessionId;
		    }

			const response = {
				"success": true
			}
			this.type = "json";
			this.body = response;
			return;
		} else {
			// if session is expired or not found
			this.session = null;
		}
	}
	yield* next;
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
