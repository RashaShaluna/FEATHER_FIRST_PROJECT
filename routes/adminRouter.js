
const express = require("express");
const session = require('express-session');
const adminRouter = express.Router();
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const db = require('../config/db');
db();
const nocache = require('nocache');

adminRouter.use(nocache());

adminRouter.use('/',session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true, 
  }));
  
  adminRouter.use(express.json());
  adminRouter.use(express.urlencoded({ extended: true }));

  const adminController=require("../controllers/adminController");

// In your adminRouter file
adminRouter.get('/log', adminController.Login);
console.log('ad');
adminRouter.post('/log', adminController.admincheck);

adminRouter.get('/dashboard', adminController.dashboard);


module.exports = adminRouter;