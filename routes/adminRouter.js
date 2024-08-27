
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
const adminController=require("../controllers/adminController");
const customerController = require('../controllers/customerController');
const categoryController = require('../controllers/catergoryController');
const productController = require('../controllers/productController');
const {userAuth,adminAuth} = require('../middleware/auth')
const sharp = require('sharp');
const uploads = require('../uplaods');

adminRouter.use(nocache());
adminRouter.use(express.static('public'));
adminRouter.use('/',session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true, 
  }));
  
adminRouter.use(express.json());
adminRouter.use(express.urlencoded({ extended: true }));

// Login management
adminRouter.get('/pageerror',adminController.pageerror);
adminRouter.get('/log', adminController.Login);
adminRouter.post('/log', adminController.admincheck);
adminRouter.get('/adminLogout',adminController.adminLogout);
adminRouter.get('/dashboard',adminAuth,adminController.dashboard);

// customer management
adminRouter.get('/users',adminAuth,customerController.customerInfo);
adminRouter.get('/blockCustomer',adminAuth,customerController.customerBlocked);
adminRouter.get('/unblockCustomer',adminAuth,customerController.customerUnBlock);

// category  management
adminRouter.get('/category',adminAuth,categoryController.categoryInfo);
adminRouter.post('/addCategory',adminAuth,categoryController.addCategory);
adminRouter.get('/addCategory',adminAuth,categoryController.addCategoryPage);
adminRouter.get('/listCategory',adminAuth,categoryController.listCategory);
adminRouter.get('/unlistCategory',adminAuth,categoryController.unListCategory);
adminRouter.post('/editCategory',adminAuth,categoryController.editCategory);
adminRouter.post('/check-category', adminAuth, categoryController.checkCategory);
adminRouter.delete('/category/delete/:categoryId',adminAuth, categoryController.softDeleteCategory);

// product management
adminRouter.get('/product',adminAuth,productController.productPage);
adminRouter.get('/addproduct',adminAuth,productController.addproductpage);
adminRouter.post('/addproduct', adminAuth, uploads.array('images', 4), productController.productAdding);


module.exports = adminRouter;