'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const ejs = require('ejs');

const PORT = process.env.PORT || 3000

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', renderHomepage);
app.get('/hello', (req, res) => {
  res.send('hello?');
})
// app.get('/searches/new', showForm);
// app.post('searches', createSearch);

function renderHomepage(req, res) {
  res.status(200).render('pages/index');
}



app.listen(PORT, () => {
  console.log(`server is up at ${PORT}`);
})