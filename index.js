const express = require ("express");
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const db = require("./config/db");
db();
const nocache = require('nocache');
const session = require('express-session');
const passport = require('./config/passport');
const userRouter = require('./routes/userRouter');

const app = express();


app.use('/',session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true, 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(nocache());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.static('public'));

app.use('/static', express.static(path.join(__dirname, 'public/assets')));



app.use('/', userRouter);

const adminRoute = require("./routes/adminRouter");
app.use('/admin', adminRoute);

// app.get('/test', (req, res) => {
//   res.send('This is a test route');
// });

app.listen(process.env.PORT, () => {
  console.log('Server is running ');
})


module.exports = app;
