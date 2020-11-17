'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const ejs = require('ejs');
require('dotenv').config();

const GOOGLE_BOOKS_API = process.env.GOOGLE_BOOKS_API;

const PORT = process.env.PORT || 3000

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', renderHomepage);

app.get('/hello', (req, res) => {
  res.send('hello?');
})

app.get('/searches/new', newForm);
app.post('/searches', createSearch);

function newForm(req, res) {
  res.render('pages/searches/new.ejs');
}

function renderHomepage(req, res) {
  res.status(200).render('pages/index');
}

function createSearch(req, res) {
  console.log('req body:', req.body);
  let url = `https://www.googleapis.com/books/v1/volumes?key=${GOOGLE_BOOKS_API}&q=`;
  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(data => {
      // console.log(data.body.items);
      return data.body.items.map(book => {
        return new Book(book.volumeInfo);
      })
    })

    .then(results => {
      res.render('pages/searches/show', { searchResults: results })
    })
    .catch(err => console.error(err))
}

function Book(info) {
  console.log(info.imageLinks)
  this.title = info.title || 'no title available';
  this.image_url = info.imageLinks.smallThumbnail || 'https://i.imgur.com/J5LVHEL.jpg';
  this.author = info.authors;
  this.description = info.description;

}


app.listen(PORT, () => {
  console.log(`server is up at ${PORT}`);
})

app.use('*', (req, res) => {
  res.status(404).send('Sorry, not found');
})
