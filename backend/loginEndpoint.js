/* eslint-disable quotes */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-useless-return */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const conn = require('./databaseConn');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username } = req.headers;
  console.log(username);
  const sql = `INSERT INTO users (username) VALUES (?);`;
  conn.query(sql, [username], (err, result) => {
    if (err) {
      console.log('user already exists');
    }
    res.send();
  });
});

module.exports = router;
