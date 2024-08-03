const express = require("express");
const path = require('path');
const env = require('dotenv').config();

const db = require("./config/db");
db();
const nocache = require('nocache');

const app = express();

// cache
app.use(nocache());

// url encoded  and json 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static file 
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'public/assets')));

// view engine 
app.set('view engine', 'ejs');
app.set('views', './views');

// port
app.listen(process.env.PORT, () => {
  console.log('Server is running ');
})

module.exports = app;