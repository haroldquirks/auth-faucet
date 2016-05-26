"use strict";

// 3rd party
const Router = require("koa-router");
const bouncer = require('koa-bouncer');
const mw = require('./middleware.js');
const db = require("./db");
const belt = require("./belt");

// initialize
const router = new Router();
//check auth
router.use(mw.ensureAuth);

router.post("/api/login", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	let user = null;
	try {
	 	// validate email
		this.validateBody("email")
	    .required("Email is required")
	    .isString()
	    .isEmail("Incorrect email format");

	    // validate email
		this.validateBody("password")
	    .required("Password is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Password is required");

	    // get validated data
		let email = this.vals.email;
		let password = this.vals.password;

		// get user by email
		user = yield db.getUserByEmail(this.vals.email);

		// check if user exist
  		this.check(user, "Incorrect email and password");

  		// check if password match
  		this.check(yield belt.checkPassword(this.vals.password, user.password), "Incorrect email and password");
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}

	// expires any active sessions of user
	yield db.updateSessionByUserId(user.id);

	// Log them in
	const session = yield db.insertSession({
		user_id: user.id,
	    ipaddress: this.request.ip,
	    interval: "4 hours"
	});

	this.session.sessionId = session.id;
	
	this.body = response;
});


router.post("/api/register", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	let user = null;
	try {
		// validate name
		this.validateBody("name")
	    .required("Name is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Name is required");

	    // validate email
		this.validateBody("email")
	    .required("Email is required")
	    .isString()
	    .isEmail("Incorrect email format")
	    .checkNot(yield db.getUserByEmail(this.vals.email), 'Email is already taken');

	    // validate email
		this.validateBody("password")
	    .required("Password is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Password is required");

	    // get validated data and put into data object
		let data = {}
		data["name"] = this.vals.name;
		data["email"] = this.vals.email;
		data["password"] = this.vals.password;
		data["ip_address"] =  this.request.ip,
    	data["user_agent"] = this.headers["user-agent"],

		// create a user
		user = yield db.insertUser(data);
		console.log(user.id);
		// create setting record for a user
		yield db.insertUserSettings(user.id);

		// check if user exist
  		this.check(user, "Database error occured. Please try again.");
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}

	// Log them in
	const session = yield db.insertSession({
		user_id: user.id,
	    ipaddress: this.request.ip,
	    interval: "4 hours"
	});

	this.session.sessionId = session.id;
	
	this.body = response;
});

router.post("/api/claim", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	try {
		// validate app id
		this.validateBody("appid")
	    .required("App is required")
	    .isString()
	    .checkPred(s => s.length > 0, "App is required")
	    .check(yield db.getAppByAppId(this.vals.appid), "App is invalid.")

	    // validate user id
		this.validateBody("userid")
	    .required("User is required")
	    .isString()
	    .check(yield db.getUserByUserId(this.vals.userid), 'User is invalid');

	    // validate token
		this.validateBody("tokenid")
	    .isString("Token is required")
	    .isString()
	    .check(yield db.getTokenByTokenId(this.vals.tokenid), 'Token is invalid');

	    const app_id = this.vals.appid;
	    const user_id = this.vals.userid;

	    // get validated data and put into data object
		let data = {}
		data["app_id"] = app_id;
		data["user_id"] = user_id;

		// get app by app id
		const app = yield db.getAppByAppId(app_id);

		// get last claim time with app id and user id
		const claim = yield db.getLastClaim(data);
		
		// if claim is not defined check the time last claim
		if(claim) {
			// convert to unix epoch timestamp equivalent to time() in php
			// lastclaim time + dispense time
			const lastClaim = Math.floor(new Date(claim.claimed_at).getTime()/1000) + app.time_limit;
			const now = Math.floor(new Date().getTime()/1000);

			// if true user is not yet allowed to claim
			if(lastClaim > now) {
				throw Error("Not yet available to claim.");
			} 
		} 
		// user not have claimed yet and is available to claim to be generic than putting it in every else above
		let faucetData = {};
		faucetData["user_id"] = user_id;
		faucetData["app_id"] = app_id;
		faucetData["amount"] = app.reward
		yield db.insertFaucetClaim(faucetData);
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}
	
	this.body = response;
});

router.post("/api/settings", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	// validate data and try/catch for handling thrown errors during validation
	let user = null;
	try {
		// validate payment option
		this.validateBody("payment_option")
	    .required("Payment Option is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Payment Option is required");

	    // validate payment detail
		this.validateBody("payment_detail")
	    .required("Payment Detail is required")
	    .isString()
	    .checkPred(s => s.length > 0, "Payment Detail is required");

	    // get user by session id
	    const user = yield db.getUserBySessionId(this.currSessionId);

	    // check if user exist
  		this.check(user, "Database error occured. Please try again.");

	    // get validated data and put into data object
		let data = {}
		data["payment_option"] = this.vals.payment_option;
		data["payment_detail"] = this.vals.payment_detail;
		data["user_id"] = user.id;

		// update user settings
		yield db.updateUserSettings(data);
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}

	this.body = response;
});

router.post("/api/payout", function*() {
	// response object
	let response = {}
	response["success"] = true;
	response["error"] = {};

	// set response to json
	this.type = "json";

	try {
		// validate app id
		this.validateBody("appid")
	    .required("App is required")
	    .isString()
	    .checkPred(s => s.length > 0, "App is required")
	    .check(yield db.getAppByAppId(this.vals.appid), "App is invalid.")

	    // validate user id
		this.validateBody("userid")
	    .required("User is required")
	    .isString()
	    .check(yield db.getUserByUserId(this.vals.userid), 'User is invalid');

	    // validate token
		this.validateBody("tokenid")
	    .isString("Token is required")
	    .check(yield db.getTokenByTokenId(this.vals.tokenid), 'Token is invalid');

		// get user by session id
		//user = yield db.getUserBySessionId(this.currSessionId);

		// check if user exist
  		//this.check(user, "Database error occured. Please try again.");

  		let data = {};
  		data["user_id"] = this.vals.userid;
  		data["app_id"] = this.vals.appid;

  		// get user balance
		const balance = yield db.getUserBalance(data);

		const dummyMinimumPayout = 10000;
		if(balance.balance >= dummyMinimumPayout) {
			let data = {};
			data["payout_amount"] = balance.balance;
			data["user_id"] = this.vals.userid;

			//subtract balance
			yield db.updateUserBalance(data);

			// process payment

			// if payment fails put back the balance and send back error message

			// else response success message

			// for now will just response success message
		} else {
			response["success"] = false;
			response["error"]["message"] = "Your balance is insufficient to payout.";
		}
	} catch(err) {
		response["success"] = false;
		response["error"]["message"] = err.message;
		this.body = response;
		return;
	}

	this.body = response;
});


module.exports = router;
