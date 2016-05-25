"use strict";

// 3rd
const bcrypt = require("bcryptjs");

// Returns hashed password value to be used in `users.digest` column
// String -> String
exports.hashPassword = function(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.hash(password, 4, function(err, hash) {
      if (err) return reject(err);
      resolve(hash);
    });
  });
};

// Compares password plaintext against bcrypted digest
// String, String -> Bool
exports.checkPassword = function(password, digest) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, digest, function(err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
};