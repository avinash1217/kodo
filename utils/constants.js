const commonUtils = require("./commons")
const env = process.env.NODE_ENV || "development";
const config = require("../db/config/config.js")[env];

const WHITELISTALL = 1;
const BLACKLISTALL = 2;

const JP1 = {
  error: true,
  errorCode: "JP1",
  userMessage: "Error creating event",
  message: "Error creating event"
};

const JP2 = {
  error: true,
  errorCode: "JP2",
  userMessage: "Error creating event",
  message: "Error creating event"
};

exports.WHITELISTALL = WHITELISTALL;
exports.BLACKLISTALL = BLACKLISTALL;
exports.JP1 = JP1;
exports.JP2 = JP2;

