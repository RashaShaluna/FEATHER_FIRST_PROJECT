const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config/db");
db();
const nocache = require("nocache");
const session = require("express-session");
const passport = require("./config/passport");
const userRouter = require("./routes/userRouter");
const flash = require("connect-flash");
const adminRoute = require("./routes/adminRouter");
const {handle404,handle500} = require('./middleware/errorHandler');

const app = express();

app.use(
  "/",
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.loggedIn = req.session.user ? true : false;
  next();
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
app.use(nocache());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use("/static", express.static(path.join(__dirname, "public/assets")));

app.use("/admin", adminRoute);
app.use("/", userRouter);

app.use(handle404);
app.use(handle500);
app.listen(process.env.PORT, () => {
  console.log("Server is running ");
});
