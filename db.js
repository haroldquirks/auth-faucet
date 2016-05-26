"use strict";

// 3rd
const uuid = require("uuid");

// 1st
const dbUtil = require("./util");
const belt = require("./belt");

// get user record by email
exports.getUserByEmail = function*(email) {
    const sql = `
        SELECT *
        FROM users
        WHERE email = $1
    `;

    return yield dbUtil.queryOne(sql, [email]);
};

// create new user
exports.insertUser = function*(data) {
    const passwordHash = yield belt.hashPassword(data.password);

    const sql = `
        INSERT INTO users (name, email, password, ip, user_agent)
        VALUES ($1, $2, $3, $4::inet, $5)
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [
        data.name, data.email, passwordHash, data.ip_address, data.user_agent]);
};

// create user session
exports.insertSession = function*(data) {
    const sql = `
        INSERT INTO sessions (id, user_id, ipaddress, expired_at)
        VALUES ($1, $2, $3::inet, NOW() + $4::interval)
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [
        uuid.v4(), data.user_id, data.ipaddress, data.interval]);
};

// create user session
exports.insertUserSettings = function*(userId) {
    const sql = `
        INSERT INTO user_settings (user_id, payment_detail)
        VALUES ($1, '')
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [userId]);
};

// insert user claim per app
exports.insertFaucetClaim = function*(data) {
    const sql = `
        INSERT INTO faucet_claims (user_id, app_id, amount)
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [data.user_id, data.app_id, data.amount]);
};

// get session by id
exports.getSessionById = function*(sessionId) {
    const sql = `;
        SELECT * 
        FROM sessions
        WHERE id = $1 and expired_at > NOW()
    `;

    return yield dbUtil.queryOne(sql, [sessionId]);
};

exports.getUserByUserId = function*(userId) {
    const sql = `
        SELECT *
        FROM users
        WHERE users.id = $1
    `;

    return yield dbUtil.queryOne(sql, [userId]);
};

exports.getAppByAppId = function*(appId) {
    const sql = `
        SELECT *
        FROM apps
        WHERE id = $1
    `;

    return yield dbUtil.queryOne(sql, [appId]);
};

exports.getTokenByTokenId = function*(tokenId) {
    const sql = `
        SELECT *
        FROM token
        WHERE id = $1
    `;

    return yield dbUtil.queryOne(sql, [tokenId]);
};

exports.getUserBySessionId = function*(sessionId) {
    const sql = `
        SELECT users.id
        FROM users
        INNER JOIN sessions
        ON (users.id = sessions.user_id)
        WHERE sessions.id = $1
    `;
    return yield dbUtil.queryOne(sql, [sessionId]);
};

exports.getUserBalance = function*(data) {
    const sql = `
        SELECT *
        FROM balance
        WHERE user_id = $1
        AND app_id = $2
    `;
    return yield dbUtil.queryOne(sql, [data.user_id, data.app_id]);
};

exports.getLastClaim = function*(data) {
    const sql = `
        SELECT *
        FROM faucet_claims
        WHERE user_id = $1
        AND app_id = $2
        ORDER BY claimed_at DESC
        LIMIT 1
    `;
    return yield dbUtil.queryOne(sql, [data.user_id, data.app_id]);
};

exports.updateSessionByUserId = function*(userId) {
    const sql = `
        UPDATE sessions
        SET expired_at = NOW()
        WHERE user_id = $1
        AND expired_at > NOW()
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [userId]);
};

exports.updateUserSettings = function*(data) {
    const sql = `
        UPDATE user_settings
        SET payment_option = $1, payment_detail = $2
        WHERE user_id = $3
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [data.payment_option, data.payment_detail, data.user_id]);
};

exports.updateUserBalance = function*(data) {
    const sql = `
        UPDATE balance
        SET balance = balance - $1
        WHERE user_id = $2
        RETURNING *
    `;

    return yield dbUtil.queryOne(sql, [data.payout_amount, data.user_id]);
};