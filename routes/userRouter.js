const express = require("express");
const router = express.Router();
const userController = require("../controllers/usercontroller");
const passport = require("passport");
const userAuth = require("../middleware/userAuth");
const path = require("path");

const addressController = require("../controllers/addressescontroller");
const wishlistController = require("../controllers/wishlistController");
const cartController = require("../controllers/cartController");
const checkoutController = require("../controllers/checkoutController");
const orderController = require("../controllers/orderController");
const walletController = require("../controllers/walletController");
const couponController = require("../controllers/couponController");
const utility = require("../helpers/utility");

router.use(
  "/shop/assets",
  express.static(path.join(__dirname, "public/shop/assets"))
);

// home
router.get("/pageNotFound", userController.pageNotFound);
router.get("/serverError", userController.serverError);
router.get("/", userController.loadlandingpage);
router.get(
  "/home",
  userAuth.isLogin,
  userAuth.isBlocked,
  userController.loadHome
);
// register
router.get("/register", userController.loadregister);
router.post("/register", userController.registerVerify);

// otp
router.post("/verifyotp", userController.verifyOtp);
router.post("/resendotp", userController.resendOtp);

// login
router.get("/login", userController.loadLogin);
router.post("/login", userController.loginVerify);
router.get("/logOut", userController.logOut);

// password
router.get("/forgotpass", userController.forgotpass);
router.post("/forgotpass", userController.forgot);
router.get("/resetPass/:_id/:token", userController.resetPass);
router.post("/resetPass/:_id/:token", userController.confirmpass);
router.get("/changedpass", userController.successpass);

// product
router.get("/shop/:categoryId", userController.shop);
router.get("/product/:id", userController.productView);
router.get("/shop", userController.shop);

// profile
router.get("/profile", userController.userProfile);
router.get("/editProfile", userController.editProfile);
router.post("/editprofile", userController.updateprofile);

// address
router.get(
  "/address",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.loadAddress
);
router.get(
  "/addAddress",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.addAddress
);
router.post(
  "/addAddress",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.addAddressVerify
);
router.delete(
  "/deleteAddress/:id",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.deleteAddress
);
router.get(
  "/editAddress/:id",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.editAddress
);
router.post(
  "/editAddress/:id",
  userAuth.isLogin,
  userAuth.isBlocked,
  addressController.editAddressVerify
);

// cart
router.get("/cart", userAuth.isLogin, userAuth.isBlocked, cartController.cart);
router.post(
  "/addToCart",
  userAuth.isLogin,
  userAuth.isBlocked,
  cartController.addToCart
);
router.post(
  "/removeFromCart",
  userAuth.isLogin,
  userAuth.isBlocked,
  cartController.removeFromCart
);
router.post(
  "/cart/update-quantity/:productId",
  userAuth.isLogin,
  userAuth.isBlocked,
  cartController.updateQuantity
);
router.get("/guestCart", cartController.guestCart);

// checkOut
router.get(
  "/checkout",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.checkout
);
router.post(
  "/checkout/editAddress/:id",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.editAddress
);
router.post(
  "/checkout/addAddress",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.addAddress
);
router.post(
  "/checkout/placeOrder",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.placeOrder
);

// order
router.get("/orderconfirmation/:orderId", orderController.orderConfirmation);
router.get(
  "/cancelOrder/:orderId/:orderItemId",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.cancelPage
);
router.post(
  "/cancelOrder/:orderId/:orderItemId",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.cancelOrder
);
router.get(
  "/orders",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.orderPage
);
router.get(
  "/orderDetail/:orderId",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.orderDetail
);
router.get(
  "/returnPage/:orderId/:orderItemId",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.returnPage
);
router.post(
  "/returnOrder/:orderId/:orderItemId",
  userAuth.isLogin,
  userAuth.isBlocked,
  orderController.returnOrder
);
router.get(
  "/invoicePDF",
  userAuth.isLogin,
  userAuth.isBlocked,
  utility.invoicePDF
);

// whislist
router.post(
  "/wishlist/add",
  userAuth.isLogin,
  userAuth.isBlocked,
  wishlistController.addToWishlist
);
router.post(
  "/wishlist/remove",
  userAuth.isLogin,
  userAuth.isBlocked,
  wishlistController.removeFromWishlist
);
router.get(
  "/wishlist",
  userAuth.isLogin,
  userAuth.isBlocked,
  wishlistController.getWishlist
);

// razorpay
router.post(
  "/createOrder",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.createOrder
);
router.post(
  "/verifyPayment",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.verifyRazorpay
);
router.post(
  "/retryPayment",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.retryPayment
);

router.get(
  "/paymentFailed",
  userAuth.isLogin,
  userAuth.isBlocked,
  checkoutController.paymentFailed
);

//wallet
router.get(
  "/wallet",
  userAuth.isLogin,
  userAuth.isBlocked,
  walletController.walletPage
);

//coupon
router.get(
  "/getCoupon",
  userAuth.isLogin,
  userAuth.isBlocked,
  couponController.getCoupon
);
router.post(
  "/applyCoupon",
  userAuth.isLogin,
  userAuth.isBlocked,
  couponController.applyCoupon
);
router.post(
  "/removeCoupon",
  userAuth.isLogin,
  userAuth.isBlocked,
  couponController.removeCoupon
);

// ----------------------google---------------------

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.user = req.user._id;
    res.redirect("/home");
  }
);

// ----------------------facebook---------------------
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: "email" })
);
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/register" }),
  function (req, res) {
    res.redirect("/home");
  }
);

module.exports = router;
