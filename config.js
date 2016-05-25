"use strict";
// Ensure require("dotenv").config() is run before this module is required

exports.PORT = Number.parseInt(process.env.PORT, 10) || 3000;
exports.DATABASE_URL = process.env.DATABASE_URL || "postgres://harold:Anonymous21@localhost:5432/auth";