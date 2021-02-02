const constants = require("../../utils/constants.js");
const commonUtils = require("../../utils/commons.js");
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const whiteListRules = {
  blackList:["createdAt","updatedAt"],
  default:constants.WHITELISTALL
};

module.exports = function(sequelize, DataTypes) {
  var Title = sequelize.define("Title", {
    id: {
      type: DataTypes.STRING,
      defaultValue: commonUtils.getDbID,
      primaryKey: true,
      allowNull: false
    },    
    name: {
        type:DataTypes.STRING,
        allowNull:false
      },
    image: {
      type:DataTypes.TEXT,
      allowNull:true
    },
    description: {
        type:DataTypes.TEXT,
        allowNull:true
      },
    dateLastEdited: {
        type: DataTypes.DATE,
        allowNull:true
    }
  }, {
    schema: config.schema,
    classMethods: {
      getWhitelistedValues: function(title) {
        return commonUtils.getWhitelistedOp(title,whiteListRules);
      }
    }
  });
  return Title;
}
