const User = require("../models/userSchema");
const Product = require("../models/productModel");
const Category = require("../models/category");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const Otp = require("../models/otp");
const jwt = require("jsonwebtoken");
const { log } = require("console");
const flash = require("connect-flash");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const messages = {
  emailRequired: "Email is required",
  passwordNotMatch: "Password do not match",
  incorrectPass: "Incorrect Password",
  userExists: "User already exists",
  userNot: "User not found",
  blockedUser: "User is blocked by admin",
  numberExist: "Phone number already exists",
  feildRequired: "All fields are required",
  mailFailed: "Email sending failed. Please try again.",
  invalidOtp: "Invalid OTP , please try again",
  invalidId: "Invalid Id",
  otpResend: "OTP resent successfully",
  otpFailed: "Failed to send OTP, please try again",
  emailRequired: "Email is required",
  passRequired: "Password required",
  mailAndPassReq: "Email and Password are required",
  invalidToken: "Invalid or expired token",
  newPassNotMatch: "New password do not match",
};

//=============================================404 page========================================================================
const pageNotFound = async (req, res) => {
  try {
    res.render("pages/page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

//============================================= 500 page========================================================================
const serverError = async (req, res) => {
  try {
    res.render("pages/server-500");
  } catch (error) {
    log(error);
    res.redirect("/serverError");
  }
};

// =================================================landing page===============================================================
const loadlandingpage = async (req, res) => {
  try {
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });
    const products = await Product.find({
      isBlocked: false,
      isDeleted: false,
    }).limit(4);

    res.render("users/landingpage", {
      title: "Feather - Homepage",
      products: products,
      categories: categories,
    });
    console.log("landing page loaded");
  } catch (error) {
    console.log("Home page not found", error.message);
    res.redirect("/pageNotFound");
  }
};

// ============================== Home page ==================================================

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;

    const [categories, products, wishlist] = await Promise.all([
      Category.find({ islisted: true, isDeleted: false }),
      Product.find({ isBlocked: false, isDeleted: false }).limit(4),
      user ? Wishlist.findOne({ userId: user }) : null,
    ]);
    const cart = (await Cart.findOne({ userId: user })) || { items: [] };

    const productsWithWishlistStatus = products.map((product) => {
      const isInWishlist = wishlist
        ? wishlist.products.some(
            (item) => item.productsId.toString() === product._id.toString()
          )
        : false;

      return {
        ...product.toObject(),
        isInWishlist,
      };
    });

    res.render("users/homepage", {
      title: "Feather - Homepage",
      products: productsWithWishlistStatus,
      categories: categories,
      user: user,
      cart,
    });
  } catch (error) {
    console.log("Home page not found", error);
    res.redirect("/pageNotFound");
  }
};
// ====================================register load=================================================================
const loadregister = async (req, res) => {
  try {
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });
    res.render("users/register", {
      title: "Feather - registerpage",
      categories: categories,
    });
  } catch (error) {
    console.log("register page not found", error.message);
    res.redirect("/pageNotFound");
  }
};

//=================================== register validation ========================================
const registerVerify = async (req, res) => {
  try {
    const [categories, findUser, findPhone] = await Promise.all([
      Category.find({ islisted: true, isDeleted: false }),
      User.findOne({ email: req.body.email }),
      User.findOne({ phone: req.body.phone }),
    ]);

    if (req.body.password !== req.body.cpassword) {
      return res.render("users/register", {
        title: "Feather - registerpage",
        message: messages.passwordNotMatch,
        categories,
      });
    }

    if (findUser) {
      return res.render("users/register", {
        title: "Feather - registerpage",
        message: messages.userExists,
        categories,
      });
    }
    if (findPhone) {
      return res.render("users/register", {
        title: "Feather - registerpage",
        message: messages.numberExist,
        categories,
      });
    }

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(req.body.email, otp);
    if (!req.body.email || req.body.email.trim() === "") {
      return res.render("users/register", {
        title: "Feather - registerpage",
        message: messages.feildRequired,
      });
    }
    if (!emailSent) {
      return res.render("users/register", {
        title: "Feather - registerpage",
        message: messages.mailFailed,
        categories,
      });
    }
    req.session.userOtp = otp;
    req.session.userData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      phone: req.body.phone,
    };

    console.log("otp is ", otp);

    res.render("users/otp", { title: "OTP Verification" });
  } catch (error) {
    console.log("Verifying register has a problem", error);
    res.redirect("/pageNotFound");
  }
};
//  OTP generation

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email sending verification
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    // Email data and subject displaying
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: "rasha14@gmail.com",
      subject: "Verifying your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp} </b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.log("Error sending email", error);
    return false;
  }
}

//====================================================== veriyin otp==========================================================
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userOtp = req.session.userOtp;
    const user = req.session.userData;

    const [categories, products] = await Promise.all([
      Category.find({ islisted: true, isDeleted: false }),
      Product.find({ isBlocked: false, isDeleted: false }),
    ]);

    if (otp.toString() === userOtp.toString()) {
      const passHash = await bcrypt.hash(user.password, 10);
      const saveUserData = new User({
        name: user.name,
        email: user.email,
        password: passHash,
        phone: user.phone,
      });

      await saveUserData.save();
      req.session.user = saveUserData._id;
      return res.json({ success: true, redirectUrl: "/home" });
    } else {
      return res.json({
        success: false,
        message: messages.invalidOtp,
      });
    }
  } catch (error) {
    console.log("Error in verifying OTP", error);
    res.redirect("/serverError");
  }
};

// ======================================================= Resend otp ============================================================
const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: messages.invalidId });
    }

    const otp = generateOtp();

    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {
      console.log("OTP resent successfully:", otp);
      res.status(200).json({ success: true, message: messages.otpResend });
    } else {
      console.error("Failed to resend OTP");
      res.status(500).json({
        success: false,
        message: messages.otpFailed,
      });
    }
  } catch (error) {
    console.error("error in resending", error);
    res.redirect("/serverError");
  }
};

// ==============================================Login load====================================================================
const loadLogin = async (req, res) => {
  try {
    const categories = await Category.find({
      islisted: true,
      isDeleted: false,
    });
    res.render("users/login", {
      title: "Feather - loginpage",
      categories: categories,
    });
  } catch (error) {
    console.log("Login page not found", error.message);
    res.redirect("/pageNotFound");
  }
};

//===================================================Verify login================================================================
const loginVerify = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [categories, products, findUser] = await Promise.all([
      Category.find({ islisted: true, isDeleted: false }),
      Product.find({
        isBlocked: false,
        isDeleted: false,
      }).limit(4),
      User.findOne({ isAdmin: 0, email: email }),
    ]);

    if (!email || !password) {
      const message =
        !email && !password
          ? messages.mailAndPassReq
          : !email
          ? messages.emailRequired
          : messages.passRequired;
      return res.render("users/login", {
        title: "Feather - loginpage",
        message,
        categories,
        products,
      });
    }

    if (!findUser) {
      return res.render("users/login", {
        title: "Feather - loginpage",
        message: messages.userNot,
        categories,
        products,
      });
    }

    if (findUser.isBlocked) {
      return res.render("users/login", {
        title: "Feather - loginpage",
        message: messages.blockedUser,
        categories,
        products,
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("users/login", {
        title: "Feather - loginpage",
        message: messages.incorrectPass,
        categories,
        products,
      });
    }

    req.session.user = findUser._id;
    res.redirect("/home");
  } catch (error) {
    console.log("Login page not found", error.message);
    res.render("users/login", {
      title: "Feather - loginpage",
      message: "Login failed, please try again",
      categories,
      products,
    });
  }
};

//=============================================Logout=======================================================================
const logOut = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/pageNotFound");
      }
      return res.redirect("/");
    });
  } catch (error) {
    console.log("Log out error");
    res.redirect("/pageNotFound");
  }
};

//=======================================================Forgot password========================================================
const forgotpass = async (req, res) => {
  try {
    res.render("users/forgotepass", { title: "Feather - forgot password" });
  } catch (error) {
    console.log("error in loading forgot");
    res.redirect("/pageNotFound");
  }
};

//======================================================Sending Link==================================================================================

const forgot = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: messages.emailRequired });
    }

    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res.json({ success: false, message: messages.userNot });
    }

    const secret = process.env.JWT_SECRET + findUser.password;
    const payLoad = { email: findUser.email, id: findUser._id };
    const token = jwt.sign(payLoad, secret, { expiresIn: "30m" });

    // Create the reset link
    const link = `http://localhost:4000/resetPass/${findUser._id}/${token}`;
    console.log(link);

    // Send the email
    const emailSent = await sendLink(email, link);

    if (emailSent) {
      return res.json({
        success: true,
        message: `Link sent successfully to your mail ${email}`,
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: messages.mailFailed });
    }
  } catch (error) {
    console.log("Error in forgot password:", error);
    res.redirect("/serverError");
  }
};

// sending link via email
async function sendLink(email, link) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Reset Password",
      text: `Your link to reset password is ${link}`,
      html: `<b>Your link ${link} </b>`,
    });

    return true;
  } catch (error) {
    console.log("Error in sending verification email:", error);
    return false;
  }
}

// ========================Reseting password token=================================================================================================

const resetPass = async (req, res) => {
  const { _id, token } = req.params;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: messages.invalidId });
    }

    const secret = process.env.JWT_SECRET + user.password;
    try {
      const payLoad = jwt.verify(token, secret);
      res.render("users/resetpass", {
        email: user.email,
        title: "Feather - reset password",
      });
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: messages.invalidToken });
    }
  } catch (error) {
    console.log("Error in reset password:", error);
    res.redirect("/serverError");
  }
};

// ======================================================================== conform password ===============================================
const confirmpass = async (req, res) => {
  try {
    const { _id, token } = req.params;
    const { password, confirmPassword } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: messages.invalidId });
    }

    const secret = process.env.JWT_SECRET + user.password;
    try {
      const payLoad = jwt.verify(token, secret);
    } catch (error) {
      console.log("Token verification error:", error);
      return res
        .status(400)
        .json({ success: false, message: messages.invalidToken });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: messages.passwordNotMatch });
    }
    const hashnew = await bcrypt.hash(password, 10);
    user.password = hashnew;
    await user.save();
    res.render("users/successpass", { title: "Feather - forgot password" });
  } catch (error) {
    console.log("Error in confirm pass", error);
    return res.redirect("/serverError");
  }
};

// =================================================== successpass ==================================================
const successpass = async (req, res) => {
  try {
    res.render("users/successpass");
  } catch (error) {
    console.log("error in successpass", error);
    return res.redirect("/pageNotFound");
  }
};

//==================================================== shop =============================================================

const shop = async (req, res) => {
  try {
    log("in shop");
    const userId = req.session.user;
    const searchQuery = req.query.q?.trim() || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "Featured";
    const categoryId = req.params.categoryId || "";
    const selectedColors = req.query.colors?.split(",") || [];
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

    const sortOptions = {
      "a-z": { name: 1 },
      "z-a": { name: -1 },
      "low-high": { salesPrice: 1 },
      "high-low": { salesPrice: -1 },
      popularity: { orderCount: -1 },
      newest: { createdAt: -1 },
      Featured: { featured: 1 },
    }[sort] || { featured: 1 };

    const productQuery = {
      isBlocked: false,
      isDeleted: false,
      salesPrice: { $gte: minPrice, $lte: maxPrice },
    };

    if (searchQuery) {
      productQuery.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { color: { $regex: searchQuery, $options: "i" } },
      ];
    }

    let categoryName = "";
    if (categoryId) {
      productQuery.category = categoryId;
    }

    if (selectedColors.length > 0) {
      productQuery.color = { $in: selectedColors };
    }

    const [
      user,
      categories,
      totalProducts,
      products,
      colors,
      category,
      wishlist,
      allColors,
    ] = await Promise.all([
      User.findById(userId),
      Category.aggregate([
        { $match: { isDeleted: false, islisted: true } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "category",
            as: "products",
          },
        },
        { $addFields: { productCount: { $size: "$products" } } },
        { $project: { name: 1, slug: 1, productCount: 1 } },
      ]),
      Product.countDocuments(productQuery),
      Product.find(productQuery)
        .populate({
          path: "category",
          match: { isDeleted: false, islisted: true },
        })
        .sort(sortOptions)
        .limit(limit)
        .skip(skip),
      Product.distinct("color", {
        ...productQuery,
        category: categoryId || undefined,
      }),
      categoryId
        ? Category.findOne({
            _id: categoryId,
            islisted: true,
            isDeleted: false,
          })
        : null,
      Wishlist.findOne({ userId: userId }),
      Product.distinct("color", { isBlocked: false, isDeleted: false }),
    ]);
    const cart = (await Cart.findOne({ userId: userId })) || { items: [] };

    colors.sort((a, b) => a.localeCompare(b));

    const totalPages = Math.ceil(totalProducts / limit);
    const wishlistProductIds = wishlist
      ? wishlist.products.map((product) => product.productsId.toString())
      : [];

    const productsWithWishlist = products.map((product) => ({
      ...product.toObject(),
      isInWishlist: wishlistProductIds.includes(product._id.toString()),
    }));
    res.render("users/shop", {
      title: "Shop - Feather",
      categories,
      products: productsWithWishlist,
      currentPage: page,
      totalPages,
      categoryName,
      colors: allColors,
      user,
      sort,
      category,
      categoryId,
      selectedColors,
      minPrice,
      maxPrice,
      searchQuery,
      wishlist,
      wishlistProductIds,
      cart,
      category,
    });
  } catch (err) {
    console.error(err);
    return res.redirect("/pageNotFound");
  }
};

// ========================================================================= Product single view ==================================================================

const productView = async (req, res) => {
  try {
    const productId = req.params.id;
    const user = req.session.user;

    const [product, categories, relatedProducts, wishlist] = await Promise.all([
      Product.findOne({
        _id: productId,
        isBlocked: false,
        isDeleted: false,
      }).populate({
        path: "category",
        match: { isDeleted: false, islisted: true },
      }),
      Category.find({ islisted: true, isDeleted: false }),
      Product.find({
        _id: { $ne: productId },
        isBlocked: false,
        isDeleted: false,
      }).limit(4),
      Wishlist.findOne({ userId: user }),
    ]);
    let isInCart = false;
    let isInWishlist = false;

    if (user) {
      const cart = await Cart.findOne({ userId: user });
      if (cart) {
        isInCart = cart.items.some(
          (item) => item.productId.toString() === productId
        );
      }

      if (wishlist) {
        isInWishlist = wishlist.products.some(
          (item) => item.productsId.toString() === productId
        );
      }
    }
    const relatedProductsWithWishlist = relatedProducts.map((product) => {
      const productObj = product.toObject();
      productObj.isInWishlist =
        wishlist?.products.some(
          (item) => item.productsId.toString() === product._id.toString()
        ) || false;
      return productObj;
    });

    res.render("users/productDetails", {
      title: `${product.name} - Feather`,
      product,
      user,
      categories,
      relatedProducts: relatedProductsWithWishlist,
      isInCart,
      isInWishlist,
    });
  } catch (error) {
    console.error(error);
    return res.redirect("/pageNotFound");
  }
};

// ======================================================== User profile ===================================================
const userProfile = async (req, res) => {
  try {
    const userId = req.session.user;

    if (userId) {
      const [user, categories] = await Promise.all([
        User.findOne({ _id: userId, isBlocked: false }),
        Category.find({
          islisted: true,
          isDeleted: false,
        }),
      ]);
      return res.render("users/userProfile", {
        title: "Account - Feather",
        activeTab: "account-details",
        categories: categories,
        user: user,
      });
    } else {
      res.redirect("/pageNotFound");
    }
  } catch (error) {
    console.error(error);
    return res.redirect("/serverError");
  }
};

// ======================================================== edit profile ===================================================
const editProfile = async (req, res) => {
  try {
    const userId = req.session.user;

    if (userId) {
      const [user, categories] = await Promise.all([
        User.findOne({ _id: userId, isBlocked: false }),
        Category.find({
          islisted: true,
          isDeleted: false,
        }),
      ]);

      return res.render("users/editprofile", {
        title: "Edit account - Feather",
        activeTab: "account-details",
        categories: categories,
        user: user,
      });
    } else {
      res.redirect("/pageNotFound");
    }
  } catch (error) {
    console.error(error);
    return res.redirect("/serverError");
  }
};

// ====================================================== upadating profile ================================================
const updateprofile = async (req, res) => {
  try {
    const userId = req.session.user;

    const { name, email, phone, password, confirmPassword, currentPassword } =
      req.body;

    const [user, categories] = await Promise.all([
      await User.findById(userId),
      Category.find({
        islisted: true,
        isDeleted: false,
      }),
    ]);
    if (!user) {
      return res.redirect("/serverError");
    }
    let isMatch;
    if (currentPassword) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.render("users/editprofile", {
          title: "Account - Feather",
          message: messages.incorrectPass,
          activeTab: "account-details",
          categories: categories,
          user: user,
        });
      }
    }
    let hashedPassword = null;
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        return res.render("users/editprofile", {
          title: "Account - Feather",
          message: messages.newPassNotMatch,
          activeTab: "account-details",
          categories: categories,
          user: user,
        });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updateData = { name, email, phone };
    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (updatedUser) {
      req.session.userData = updatedUser;
      return res.render("users/userProfile", {
        title: "Account - Feather",
        activeTab: "account-details",
        categories: categories,
        user: updatedUser,
      });
    } else {
      res.redirect("/serverError");
    }
  } catch (error) {
    console.log("error:", error);
    res.redirect("/serverError");
  }
};

module.exports = {
  loadlandingpage,
  pageNotFound,
  loadregister,
  registerVerify,
  loadHome,
  loadLogin,
  loginVerify,
  verifyOtp,
  resendOtp,
  logOut,
  forgotpass,
  forgot,
  resetPass,
  confirmpass,
  successpass,
  shop,
  productView,
  serverError,
  userProfile,
  updateprofile,
  editProfile,
};
