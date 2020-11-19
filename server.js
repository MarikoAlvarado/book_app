'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const methodOverride = require('method-override');
const pg = require('pg');
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.err(err));

const GOOGLE_BOOKS_API = process.env.GOOGLE_BOOKS_API;
const PORT = process.env.PORT || 3000

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', renderHomepage);
app.get('/books/:id', getOneBook);
app.post('/books', addBook);

app.use(methodOverride('_method'));
app.put('/update/:id', updateBook);
app.delete('/delete/:id', deleteBook);

app.get('/searches/new', newForm);
app.post('/searches', createSearch);


function deleteBook(req, res) {
  let SQL = `DELETE FROM books WHERE id=${req.params.id};`;
  client.query(SQL)
    .then(res.redirect(`../`))
    .catch(err => console.error(err));
}


function updateBook(req, res) {
  console.log('method', req.method);
  let { title, author, isbn, image_url, description } = req.body;
  let SQL = `UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE id=$6;`;
  let values = [title, author, isbn, image_url, description, req.params.id];

  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.id}`))
    .catch(err => console.error(err));
}

function newForm(req, res) {
  res.render('pages/searches/new.ejs');
}

function renderHomepage(req, res) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => res.render('./pages/index', { results: results.rows }))
    .catch(err => console.error(err));
}

function getOneBook(req, res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [req.params.id];
  return client.query(SQL, values)
    .then(result => {
      return res.render('./pages/books/show', { books: result.rows[0] })
    })
    .catch(err => console.error(err));
}

function createSearch(req, res) {
  console.log('req body:', req.body);
  let url = `https://www.googleapis.com/books/v1/volumes?key=${GOOGLE_BOOKS_API}&q=`;
  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(data => {
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
  this.image_url = info.imageLinks ? info.imageLinks.smallThumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.author = info.authors ? info.authors[0] : 'Author unavailable';
  this.isbn = info.industryIdentifiers ? info.industryIdentifiers[0].identifier : 'Not available';
  this.description = info.description ? info.description : 'No description available';

}

function addBook(req, res) {
  let chosenBook = JSON.parse(req.body.newBook);
  let { title, author, isbn, image_url, description } = chosenBook;
  let SQL = 'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id;';
  let values = [title, author, isbn, image_url, description];

  return client.query(SQL, values)
    .then(data => {
      res.redirect(`./books/${data.rows[0].id}`)
    })
    .catch(err => console.error(err));
}
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is up at ${PORT}`);
    })
  })

app.use('*', (req, res) => {
  res.status(404).send('Sorry, not found');
})
