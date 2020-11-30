/* eslint-disable prefer-template */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/routes/login.html'));
});

app.get('/addPost', (req, res) => {
  res.sendFile(path.join(__dirname, './public/routes/newPost.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, './public/routes/index.html'));
});

app.get('/update', (req, res) => {
  res.sendFile(path.join(__dirname, './public/routes/update.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
