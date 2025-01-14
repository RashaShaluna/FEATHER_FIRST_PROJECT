
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
const orderController = require('../controllers/orderController');
const offerController = require('../controllers/offerController');
const couponController = require('../controllers/couponController');
const adminAuth = require('../middleware/adminAuth');
const uploads = require('../uplaods');
const utility = require('../helpers/utility');

adminRouter.use(nocache());
// adminRouter.use(express.static('public'));
adminRouter.use(express.static(path.join(__dirname, 'public')));
adminRouter.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
adminRouter.use('/images', express.static(path.join(__dirname, '../public')));

adminRouter.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true, 
    
  }));
  
adminRouter.use(express.json());
adminRouter.use(express.urlencoded({ extended: true }));

// Login management
adminRouter.get('/pageerror',adminController.pageerror);
adminRouter.get('/log', adminController.Login);
adminRouter.post('/log',adminController.admincheck);
adminRouter.get('/adminLogout',adminController.adminLogout);

//dashboard
adminRouter.get('/dashboard',adminAuth.isAdmin,adminController.dashboard);

//salesreport
adminRouter.get('/salesReport',adminAuth.isAdmin,adminController.salesReport);
adminRouter.get('/download-pdf',adminAuth.isAdmin,utility.downloadPdf);
adminRouter.get('/download-excel',adminAuth.isAdmin,utility.downloadExcel);

// customer management
adminRouter.get('/users',adminAuth.isAdmin,customerController.customerInfo);
adminRouter.get('/blockCustomer',adminAuth.isAdmin,customerController.customerBlocked);
adminRouter.get('/unblockCustomer',adminAuth.isAdmin,customerController.customerUnBlock);

// category  management
adminRouter.get('/category',adminAuth.isAdmin,categoryController.categoryInfo);
adminRouter.post('/addCategory',adminAuth.isAdmin,categoryController.addCategory);
adminRouter.get('/addCategory',adminAuth.isAdmin,categoryController.addCategoryPage);
adminRouter.get('/listCategory',adminAuth.isAdmin,categoryController.listCategory);
adminRouter.get('/unlistCategory',adminAuth.isAdmin,categoryController.unListCategory);
adminRouter.post('/editCategory',adminAuth.isAdmin,categoryController.editCategory);
adminRouter.post('/check-category', adminAuth.isAdmin, categoryController.checkCategory);
adminRouter.delete('/category/delete/:categoryId',adminAuth.isAdmin, categoryController.softDeleteCategory);

// product management
adminRouter.get('/product',adminAuth.isAdmin,productController.productPage);
adminRouter.get('/addproduct',adminAuth.isAdmin,productController.addproductpage);
adminRouter.post('/addproduct', adminAuth.isAdmin, uploads.array('images', 3), productController.productAdding);
adminRouter.get('/outstock',adminAuth.isAdmin,productController.outstockProduct);
adminRouter.get('/instock',adminAuth.isAdmin,productController.instockProduct);
adminRouter.get('/blockproduct',adminAuth.isAdmin,productController.productBlocked);
adminRouter.get('/unblockproduct',adminAuth.isAdmin,productController.productUnBlock);
adminRouter.delete('/product/delete/:productId', adminAuth.isAdmin, productController.softDeleteProduct);
adminRouter.get('/editproduct/:id', productController.editProduct);
adminRouter.post(
  '/editproduct/:id',  
  uploads.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ]),
  productController.editingProduct
);
adminRouter.delete('/delete-image',productController.deleteSingleImage)
 
// order management 
adminRouter.get('/orderList',adminAuth.isAdmin, orderController. orderList) 
adminRouter.post('/changeStatus',adminAuth.isAdmin,orderController.changeStatus)
adminRouter.get('/orderItem/:orderId',adminAuth.isAdmin,orderController.orderItem)

//offer managemnt
adminRouter.get('/offerdeactive',adminAuth.isAdmin,offerController.offerDeactive);
adminRouter.get('/offeractive',adminAuth.isAdmin,offerController.offerActive);
adminRouter.get('/offerCategoryDeactive',adminAuth.isAdmin,offerController.offerCategoryDeactive);
adminRouter.get('/offerCategoryActive',adminAuth.isAdmin,offerController.offerCategoryActive);

//coupon mangement
adminRouter.get('/coupon',adminAuth.isAdmin,couponController.couponPage);
adminRouter.post('/addCoupon',adminAuth.isAdmin,couponController.addCoupon);
adminRouter.patch('/coupon/delete/:id',adminAuth.isAdmin,couponController.deleteCoupon);
adminRouter.get('/coupon/deactivate',adminAuth.isAdmin,couponController.deactivateCoupon);
adminRouter.get('/coupon/activate',adminAuth.isAdmin,couponController.activeCoupon );






module.exports = adminRouter;