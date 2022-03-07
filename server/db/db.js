const Sequelize = require("sequelize");

const dotenv = require("dotenv");
dotenv.config();

// const user = process.env.USER;
// const host = process.env.HOST;
// const database = process.env.DATABASE;
// const password = process.env.PASSWORD;
// const user = "postgres";
// const host = "localhost";
// const database = "messenger";
// const password = "R@zgriz086";

const db = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost:5432/messenger",
  {
    logging: false,
  }
);

// const db = new Sequelize(database, user, password, {
//   host,
//   dialect: "postgres",
//   logging: false,
// });
module.exports = db;
