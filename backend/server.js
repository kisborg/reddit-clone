/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const postsEndpoint = require('./PostsEndpoint');
const loginEndpoint = require('./loginEndpoint');

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, username");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  next();
});

app.use(express.json());
app.use(postsEndpoint);
app.use(loginEndpoint);

app.get('/', (req, res) => {
  res.json('It\'s working!!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
