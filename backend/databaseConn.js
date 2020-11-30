/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
});

const mysql = require('mysql');

const conn = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
console.log(process.env.MYSQL_DATABASE);
module.exports = conn;
