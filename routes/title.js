const express = require("express")
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];
const models = require("../db/models");
const commonUtils = require("../utils/commons.js");
const router = express.Router();
const logger = require("../services/logger");
const request = require("request-promise");
const Either = require("../lib/Either.js");
const R = require("ramda");
const fs = require('fs');
const path = require('path');
const constants = require("../utils/constants.js")
const helper = require("../utils/helper");
const async = require("asyncawait/async");
const await = require("asyncawait/await");
const Title = models.Title;
const moment = require("moment-timezone");
const chance = require("chance").Chance();
const uuid = require("uuid");

router.post("/", (req, res) => {
    isValidSearch(req.state)
        .chain(state=>fetchResultByFilters(state).liftOE())
        .bichain(l => postTxn(l, false), r => postTxn(r, true))
        .fold(l => l, r => r)
        .subscribe(val => {
            return res.status(200).send(val);
        }, err => {
            helper.log500Error(err, req);
            return res.status(500).send({ error: true, message: "Internal Server Error" });
        })
});

const isValidSearch = state => {
    let status = false;
    status = R.allPass([
      reqBody => R.is(Object, reqBody)
    ])(state.reqBody);
    return status ? Either.Right(state).liftOE() :
      Either.Left(R.merge(state, { error: true, message: "Bad Request" })).liftOE();
}

const fetchResultByFilters = async(state => {
  let result = "";
  if(state.reqQuery.limit && state.reqQuery.offset) {
    if(state.reqBody.orderBy == "title"){
      result = await(Title.findAndCountAll( {
        order: filterOrderClausebyTitle(state),
        limit: state.reqQuery.limit,
        offset: state.reqQuery.offset
     }));
    }else if(state.reqBody.searchBy){
      return fetchByKeys(state)
    }else{
      result = await(Title.findAndCountAll( {
        order: filterOrderClausebydateLastEdited(state),
        limit: state.reqQuery.limit,
        offset: state.reqQuery.offset
     }));
    }
  }else {
    result = await(Title.findAndCountAll( {
       order: filterOrderClausebydateLastEdited(state)
    }));
  }
  let titles = result.rows;
  let count = result.count;
  titles = R.map(x => x.dataValues, titles);
  return Either.Right(R.merge(state ,{titles:titles, count: count}));
});

const filterOrderClausebydateLastEdited = state => {
  let orderKey = state.reqQuery.orderKey || 'dateLastEdited';
  let orderType = state.reqQuery.orderType || 'DESC';
  return [[orderKey, orderType]];
}

const filterOrderClausebyTitle = state => {
  let orderKey = state.reqQuery.orderKey || 'name';
  let orderType = state.reqQuery.orderType || 'ASC';
  return [[orderKey, orderType]];
}

const fetchByKeys = async(state =>{
  let query = `SELECT * FROM "Titles" WHERE "name" ~* '${state.reqBody.searchBy}';`;
  console.log("query", query);
  let result = await(models.sequelize.query(query));
  if(result[0] ){
    let titles, count;
    titles = result[0];
    count = result[0].length;
    console.log("result", result);
    return Either.Right(R.merge(state, { titles:titles, count: count }));
  }
  return Either.Right(R.merge(state, { message: "No records found" }));
});

const postTxn = (state, flag) => {
    console.log("state-------->", state);
    return logTxnInfo(state, flag)
      .bimap(state => helper.getWhitelistedOp(state, {
        whiteList: ["titles", "count","error", "message",
         "userMessage", "errorCode", "customer", "address"],
        blackList: [],
        default: constants.BLACKLISTALL
      }), state => helper.getWhitelistedOp(state, {
        whiteList: ["titles", "count","error", "message",
         "userMessage", "errorCode", "customer", "address" ],
        blackList: [],
        default: constants.BLACKLISTALL
      }))
  };
  
  const logTxnInfo = (state, flag) => {
    try {
      logger.info(state.sessionId, state.requestId, state);
    } catch (e) {
      console.log("Error while logging ", state, e);
    }
    return flag ? Either.Right(state).liftOE() : Either.Left(state).liftOE();
  };

module.exports = router;