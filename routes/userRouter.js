const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;//gp


router.get('/pageNotFound',userController.pageNotFound);
router.get('/', userController.loadlandingpage);
router.get('/home',userController.loadHome);

router.get('/register', userController.loadregister);
router.post('/register', userController.registerVerify);

router.post('/verifyotp', userController.verifyOtp);
router.post('/resendotp',userController.resendOtp);

router.get('/login', userController.loadLogin)
router.post('/login', userController.loginVerify)
router.get('/logOut',userController.logOut)

router.get('/forgotpass',userController.forgotpass);
router.post('/forgotpass',userController.forgot);
router.get('/resetPass/:_id/:token',userController.resetPass);
router.post('/resetPass/:_id/:token',userController. confirmpass);



// ----------------------google---------------------

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/register'}),(req,res)=>{
    res.redirect('/home')
})

// ----------------------facebook---------------------
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
router.get('/auth/facebook/callback',passport.authenticate('facebook', {failureRedirect: '/register',}),function (req, res) { res.redirect('/home');});






module.exports = router;
