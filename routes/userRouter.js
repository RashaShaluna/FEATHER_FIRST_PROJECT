const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const passport = require('passport');
const userAuth = require('../middleware/userAuth');
const path = require('path');

const addressController = require('../controllers/addressescontroller');
const wishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

router.use('/shop/assets', express.static(path.join(__dirname, 'public/shop/assets')));


// home
router.get('/pageNotFound',userController.pageNotFound);
router.get('/serverError',userController.serverError);
router.get('/',userController.loadlandingpage);
router.get('/home',userAuth.isLogin,userController.loadHome);

// register
router.get('/register', userController.loadregister);
router.post('/register',userController.registerVerify);

// otp
router.post('/verifyotp', userController.verifyOtp);
router.post('/resendotp',userController.resendOtp);

// login
router.get('/login',userController.loadLogin)
router.post('/login', userController.loginVerify)
router.get('/logOut',userController.logOut)

// password
router.get('/forgotpass',userController.forgotpass);
router.post('/forgotpass',userController.forgot);
router.get('/resetPass/:_id/:token',userController.resetPass);
router.post('/resetPass/:_id/:token',userController. confirmpass);
router.get('/changedpass',userController.successpass);

// product
router.get('/shop/:categoryId',userController.shop);
router.get('/product/:id', userController. productView);

// profile
router.get('/profile',userController.userProfile);
router.get('/editProfile',userController.editProfile);
router.post('/editprofile', userController.updateprofile);

// address
router.get('/address',userAuth.isLogin,addressController.loadAddress);
router.get('/addAddress',userAuth.isLogin,addressController.addAddress);
router.post('/addAddress',userAuth.isLogin,addressController.addAddressVerify);
router.delete('/deleteAddress/:id',userAuth.isLogin,addressController.deleteAddress);
router.get('/editAddress/:id',userAuth.isLogin,addressController.editAddress);
router.post('/editAddress/:id',userAuth.isLogin,addressController.editAddressVerify);

// whislist
// router.get('/whislist',userAuth.isLogin, wishlistController.whislist);
// router.post('/addWishlist',userAuth.isLogin, wishlistController.addtoWishlist);
// router.post('/removeWishlist',userAuth.isLogin, wishlistController. removeFromWishlist);

// cart 
router.get('/cart',userAuth.isLogin, cartController.cart);
router.post('/addToCart',userAuth.isLogin, cartController.addToCart );
router.post('/removeFromCart',userAuth.isLogin, cartController.removeFromCart);
router.post('/cart/update-quantity/:productId',userAuth.isLogin, cartController.updateQuantity);

// checkOut
router.get('/checkout',userAuth.isLogin,orderController.checkout);
router.post('/checkout/editAddress/:id',userAuth.isLogin ,orderController.editAddress);









// ----------------------google---------------------

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
    res.redirect('/home')
})

// ----------------------facebook---------------------
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
router.get('/auth/facebook/callback',passport.authenticate('facebook', {failureRedirect: '/register',}),function (req, res) { 
    
    res.redirect('/home');
});






module.exports = router;
