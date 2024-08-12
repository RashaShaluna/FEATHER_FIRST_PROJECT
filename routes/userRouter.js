const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');

router.get('/pageNotFound',userController.pageNotFound);
router.get('/', userController.loadlandingpage);
router.get('/home',userController.loadHome);

router.get('/register', userController.loadregister);
router.post('/register', userController.registerVerify);

// router.get('/otp', userController.loadOtp);
router.post('/verifyotp', userController.verifyOtp);

router.get('/login', userController.loadLogin)
// router.get('/login', userController.loginVerify)









module.exports = router;
