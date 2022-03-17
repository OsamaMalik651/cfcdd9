const Sequelize = require("sequelize");
const db = require("../db");

const Member = db.define("member", {});

module.exports = Member;
