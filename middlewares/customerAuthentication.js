const models = require("../db/models");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];
const logger = require("../services/logger");
const helper = require("../utils/helper.js");
const ObEither = require("../lib/ObservableEither");
const Either = require("../lib/Either.js");
const R = require("ramda");
const crypto = require("crypto");
const cryptoUtils = require("../utils/cryptoUtils");
const redis = require("../services/redis");
const ndkComputation = require("../npci/keys/"+env+"/npci-switch/" + "ndkComputation.js");

module.exports = function(req, res, next) {
  let state = req.state;
  if(req.rawBody) {
    state.rawBody = req.rawBody;
  }
  addCustomer(state)
    .fold(l => {
      if (l.error) {
        return l;
      } else {
        logger.error("Error verifying customer ", l);
        return R.merge(l,{ error: true, message: "Invalid Credentials" });
      }
    }, r => r)
    .subscribe(val => {
      if (val.error) {
        helper.logRequest(val);
        return res.status(401).send({
          error:val.error,
          message:val.message,
          userMessage:val.userMessage
        });
      }
      req.state = val;
      return next();
    }, err => {
      helper.logError(err);
      return res.status(500).send({error:true,message: "Internal Server Error" });
    });
};

const addCustomer = state => {
    return fetchCustomer(state)
}

const fetchCustomer = state => {
  return verifyToken(state)
};

const getTokenByHash = helper.genericModelOutput("customer", {
    error: true,
    message: "Error finding customer "
  },
  state => helper.findOne("Customer",{
    token: state.reqHeaders["x-cauth-token"]
  })
);

const findTokenByHash = state => {
  return getTokenByHash(state)
    .chain(token => Either.fromCondition(state, R.merge(state,{
      error: true,
      message: "Token Expired",
      userMessage: "Session Expired"
    }), state => !hasTokenExpired(state)).liftOE());
};

const verifyToken = (state) => {
  if (state.reqHeaders["x-cauth-token"]) {
    return findTokenByHash(state)
  } else {
    return Either.Left({ error: true, message: "Invalid headers", userMessage: "Invalid headers" }).liftOE()
  }
};

const hasTokenExpired = (state) => {
  return false;
};
