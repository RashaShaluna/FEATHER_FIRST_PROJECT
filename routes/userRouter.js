const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const passport = require('passport');
const userAuth = require('../middleware/userAuth');
const path = require('path');

router.use('/shop/assets', express.static(path.join(__dirname, 'public/shop/assets')));


// home
router.get('/pageNotFound',userController.pageNotFound);
router.get('/serverError',userController.serverError);
router.get('/',userAuth.logout,userController.loadlandingpage);
router.get('/home',userAuth.isBlocked,userController.loadHome);

// register
router.get('/register', userController.loadregister);
router.post('/register',userController.registerVerify);

// otp
router.post('/verifyotp', userController.verifyOtp);
router.post('/resendotp',userController.resendOtp);

// login
router.get('/login',userController.loadLogin)
router.post('/login', userController.loginVerify)
router.get('/logOut',userAuth.logout,userController.logOut)

// password
router.get('/forgotpass',userController.forgotpass);
router.post('/forgotpass',userController.forgot);
router.get('/resetPass/:_id/:token',userController.resetPass);
router.post('/resetPass/:_id/:token',userController. confirmpass);
router.get('/changedpass',userController.successpass);

// shop
router.get('/shop/:categoryId?',userAuth.isBlocked,userController.shop);
router.get('/product/:id',userAuth.isBlocked,userController. productView);

// profile
router.get('/profile',userController.userProfile);
router.post('/editprofile', userController.updateprofile);



















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
