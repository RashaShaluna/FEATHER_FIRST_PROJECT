const express = require ("express");
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const db = require("./config/db");
db();
const nocache = require('nocache');
const app = express();
const session = require('express-session');

// session 
app.use('/',session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true, 
}));

// cache
app.use(nocache());

// url encoded and json 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// static files 
// app.use('/static',express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

app.use('/static', express.static(path.join(__dirname, 'public/assets')));

// load router
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
console.log('Type of userRouter:', typeof userRouter); 

// user and admin routes
app.use('/', userRouter);
// app.use('/', adminRouter);

// port
app.listen(process.env.PORT, () => {
  console.log('Server is running ');
})


module.exports = app;
