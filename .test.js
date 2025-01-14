
// const { ObjectId } = require("mongodb");
const User = require("../models/userModel");
const otp = require("../models/otp");
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require("../models/cartModel")
const Address = require("../models/addressModel")
const Order = require("../models/ordersModel")
const Coupon = require("../models/couponModel");
const Offer = require("../models/offerModel");
const Wallet = require('../models/walletModel');
const Razorpay = require('razorpay');

const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const config = require("../config/config");
require('dotenv').config();
const { ObjectId } = require('mongodb');
const { type } = require("os");


//google
const loadAuth = (req, res) => {
  res.render('users/login')
}

const successGoogleLogin = async (req, res) => {
  try {
    console.log(req.user);
    res.render('users/home')

  } catch (error) {
    console.log(error);
  }
}

const failureLogin = async (req, res) => {
  try {
    res.render("users/login")
  } catch (error) {
    console.log(error);
  }
}

passport.serializeUser((user, done) => {
  done(null, user);
})

passport.deserializeUser((user, done) => {
  done(null, user);
})

passport.use(new GoogleStrategy({
  clientID: process.env.CLIEND_ID,
  clientSecret: process.env.CLIEND_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback',
  passReqToCallback: true
},
  function (req, accessToken, refreshToken, profile, done) {
    return done(null, profile)
  }

));



//facebook
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

passport.use(new FacebookStrategy({
  clientID: config.facebookAuth.CliendID,
  clientSecret: config.facebookAuth.CliendSecret,
  callbackURL: config.facebookAuth.callbackURL
}, function (accessToken, refreshToken, profile, done) {
  return done(null, profile);
}
));



//set bcrypt

const securedPassword = async (password) => {

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;

  } catch (error) {
    console.log(error);
  }
}

//forgot bycrypt
const secureToken = async (token) => {

  try {

    const tokenHash = await bcrypt.hash(token, 5);
    return tokenHash;

  } catch (error) {

    console.log(error.message);

  }

};

// setup homepage
const loadHome = async (req, res) => {
  try {

    res.render("users/homepage");

  } catch (error) {

    console.log(error);

  }
};


//set up loginpage
const loginPage = async (req, res) => {
  try {
    const message = req.flash('message');
    const msg = req.flash('passwordChanged');
    const passMsg = req.flash('passwordIncorrect');

    res.render("users/login", { message, msg, passMsg });
  } catch (error) {
    console.log(error);
  }
};


const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;

    const userData = await User.findOne({ email: email });
    console.log(userData);



    if (userData) {
      const passwordMatch = await bcrypt.compare(req.body.password, userData.password);

      if (userData.is_blocked) {
        req.flash('message', 'Account is blocked');
        return res.redirect('/login');
      }

      if (passwordMatch) {
        req.session.user = userData._id;

        res.redirect("/home");
      } else {
        req.flash('passwordIncorrect', 'Incorrect password.');
        res.redirect("/login");
      }
    } else {
      req.flash('message', 'Email and Password incorrect.'); // Set flash message for incorrect email/password combination
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);

    // res.status(500).send("Email and Password Incorrect");
  }
}




//setup registration page
const signUp = async (req, res) => {

  try {

    const emailexitss = req.flash("emailexits");
    const confirmPassWrong = req.flash("confirmPassWrong");

    res.render('users/registration', { emailAlredyExits: emailexitss, confirmPassWrongg: confirmPassWrong });

  } catch (error) {

    console.log(error.message);

  }
};





//forgotpassword
const forgotPass = async (req, res) => {
  try {
    const msg = req.flash('message')
    res.render("users/forgotpass", { msg });
  } catch (error) {
    console.log(error);
  }
}

//forgot verify
const forgotVerify = async (req, res) => {
  try {

    const email = req.body.email;
    console.log(email);
    const userData = await User.findOne({ email: email });
    req.session.forgotData = userData;

    if (userData) {
      const name = userData.name;

      const OTPP = generateOTP();
      const token = generateTokenForgottPassword();
      console.log("Forgot Password :-" + OTPP);

      req.session.otp = OTPP;

      sendMailForgotPassword(name, email, OTPP, res, token);

    } else {

      req.flash('message', "Invalid Email");
      res.redirect("/forgotpass");
    }

  } catch (error) {
    console.log(error);

  }
}

//sent otp mail forgot
const sendMailForgotPassword = async (name, email, otpp, res, token) => {

  try {

    //  Send Email Method :-
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rishadrasheed147@gmail.com',
        pass: 'thtp kkww irxp cmox'
      }
    });

    //  Compose Email :-

    const mailOption = {

      from: 'rishadrasheed147@gmail.com',
      to: email,
      subject: 'For Forgot Password Verification',
      html: `<h3> Hello ${name} Welcome to Victor</h3>
          <br><p>Enter ${otpp} on the OTP Box to Change Your Forgotten Password</p>`
    };

    //  Send Email :-

    transporter.sendMail(mailOption, function (error, info) {

      if (error) {

        console.log('Error Sending Email:-', error.message);

      } else {

        console.log("Email Has Been Sended:-", info.response);
      }

    });

    const tokenHashed = await secureToken(token)

    const forgotpassdData = new otp({

      otp: otpp,
      token: tokenHashed,
      userEmail: email,

    });

    forgotpassdData.save();
    res.redirect(`/otppage?email=${email}&&token=${token}`);

  } catch (error) {

    console.log(error.message);

  }

};


//  Genrate OTP For Forgot Password :-

const generateTokenForgottPassword = () => {


  const digits = '0123456789';

  let token = '';

  for (let i = 0; i < 4; i++) {

    token += digits[Math.floor(Math.random() * 10)];
  };

  return token;

}


//forgot load confirm password page
const loadConfirmPassword = async (req, res) => {

  try {

    const forgotEmail = req.query.email
    const forgotpassMsg = req.flash("passwordChanged");

    res.render("users/resetpass", { forgotEmail, msg: forgotpassMsg });

  } catch (error) {

    console.log(error.message);

  }

};


// forgot verifyConfirmPassword (Post Method)

const verifyConfirmPassword = async (req, res) => {

  try {

    const bodyEmail = req.body.email;
    const passwordd = req.body.password;
    const confirmPassword = req.body.confirmPasword;
    console.log(bodyEmail);

    const hashPasswordd = await securedPassword(passwordd);

    if (passwordd == confirmPassword) {

      const emailData = await User.findOne({ email: bodyEmail });

      if (emailData) {

        await User.findOneAndUpdate({ email: bodyEmail }, { $set: { password: hashPasswordd } });
        req.flash('passwordChanged', "Password Changed Successfully");
        res.redirect('/login');

      }

    }
    console.log("password changed successfully");

  } catch (error) {

    console.log(error.message);

  }

};



//signup verify user 
const insertUser = async (req, res) => {

  try {

    const emailExists = await User.findOne({ email: req.body.email });

    if (emailExists) {

      req.flash('emailexits', "Email Already Exist");
      res.redirect('/registration');

    } else {

      const user = new User({

        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
        is_admin: false,
        is_blocked: false

      });

      //  Password and Confirm Password Checkingn :-

      const bodyNorPass = req.body.password;
      const bodyConfrimPass = req.body.confirmPassword;

      if (bodyNorPass == bodyConfrimPass) {

        req.session.userSession = user  //  Save User Data in Session

        const userData = req.session.userSession;


        if (userData) {

          const generatedOTP = generateOTP();    //  Assign OTP to Variable

          req.session.otp = generatedOTP;     //  Otp Saving Session 

          console.log(generatedOTP);

          await sendOTPmail(req.body.name, req.body.email, generatedOTP, res);     // Sended Otp

          setTimeout(async () => {   //  Deleting Otp in the Dbs

            await otp.findOneAndDelete({ emailId: req.body.email });

          }, 60000);

          // res.redirect('/otpVerification');

        } else {

          res.redirect('/registraton');

        };

      } else {

        req.flash("confirmPassWrong", "Password Not Match...");
        res.redirect('/registration');

      }

    }

  } catch (error) {

    console.log(error.message);

  }

};


//setup otp page
const otpPage = async (req, res) => {
  try {

    const queryEmail = req.query.email;
    const invalidOtp = req.flash('flash')
    const tokkken = req.query.token || null;

    // console.log(invalidOtp);

    res.render("users/otppage", { queryEmail, tokkken, msg: invalidOtp, otpMsg: "invalidOtp" });

  } catch (error) {
    console.log(error);
  }
}


//  Function to Generator Otp :- ,
const generateOTP = () => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};


//sent otp mail signup
const sendOTPmail = async (name, email, sendOtp, res) => {

  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rishadrasheed147@gmail.com',
        pass: 'thtp kkww irxp cmox'
      }
    });


    // compose email 
    const mailOption = {
      from: 'rishadrasheed147@gmail.com',
      to: email,
      subject: 'For Otp Verification',
      html: `<h3>Hello ${name},Welcome To Victor</h3> <br> <h4>Enter : ${sendOtp} on the OTP Box to register</h4>`
    }

    //send mail
    transporter.sendMail(mailOption, function (error, info) {

      if (error) {
        console.log('Erro sending mail :- ', error.message);
      } else {
        console.log('Email has been sended :- ', info.response);
      }
    });

    // otp schema adding 
    const userOTP = new otp({
      userEmail: email,
      otp: sendOtp,

    });

    await userOTP.save()

    res.redirect(`/otppage?email=${email}`)

    console.log('otp saved');

  } catch (error) {
    console.log(error.message);
  }
}


//verify OTP signup

const verifyOTP = async (req, res) => {

  try {
    const userSessionn = req.session.userSession;   //  Assign Session in Variable
    const getQueryEMail = req.body.email;
    const getToken = req.body.token;

    // console.log(getToken);


    const bodyOtp = req.body.inp1 + req.body.inp2 + req.body.inp3 + req.body.inp4;
    if (getToken && getQueryEMail) {

      const verifyForgotEmail = await otp.findOne({ otp: bodyOtp, userEmail: getQueryEMail });

      if (verifyForgotEmail) {

        res.redirect(`/resetpass?email=${getQueryEMail}`);

      } else {

        req.flash('flash', "Invalid OTP!!!");
        res.redirect(`/otppage?email=${getQueryEMail}&&token=${getToken}`);

      }

    } else {

      const verifiedOtp = await otp.findOne({ otp: bodyOtp, userEmail: getQueryEMail });

      if (verifiedOtp) {

        if (userSessionn.email == getQueryEMail) {

          const hashPassword = await securedPassword(req.session.userSession.password);

          const userSessionData = new User({

            name: req.session.userSession.name,
            email: req.session.userSession.email,
            mobile: req.session.userSession.mobile,
            password: hashPassword,
            is_admin: false,
            is_blocked: false,

          });

          userSessionData.save();

          req.session.otp = undefined;    //  Deleting The otp after login user

          req.session.user = userSessionData; //  Save User Data in Session (Orginal)

          await User.findByIdAndUpdate({ _id: userSessionData._id }, { $set: { is_verified: true } });

          // req.flash("flash", "Verified Successfully");    //  Sweet Alert
          res.redirect('/login');

        }

      } else {
        req.flash("flash", "Invalid OTP");
        res.redirect(`/otppage?email=${getQueryEMail}`)

      }
    }

  } catch (error) {

    console.log(error);

  }

};


//resend otp signup
const loadResendOtp = async (req, res) => {

  try {

    const userdata = req.query.email;   //  Query Email

    // console.log(userdata + "hahha");

    const userSessionnn = req.session.userSession;  //  Session User Data

    if (userSessionnn.email == userdata) {

      const generatedotp = generateOTP();

      console.log(generatedotp + " Re-send Otp");

      await sendOTPmail(userSessionnn.name, userSessionnn.email, generatedotp, res);

      setTimeout(async () => {    //  This also Deleting the Otp in Dbs 

        await otp.findOneAndDelete({ userEmail: userdata });

      }, 60000);

    }

  } catch (error) {

    console.log(error);

  }

}


//setup main home
const home = async (req, res) => {
  try {
    // const userData = req.session.user
    res.render("users/home");
  } catch (error) {
    console.log(error);
  }
}

//logout button
const logoutHome = async (req, res) => {
  try {
    req.session.user = null
    res.redirect('/')
  } catch (error) {
    console.log(error);
  }
}


// ===================================================views pages=========================================================

//setup shopPage
const shopPage = async (req, res) => {
  try {
    const categories = await Category.find({});

    const selectedCategory = req.query.category || null;
    console.log(selectedCategory, 'Category Selected');

    const sortBy = req.query.sortby || 'popularity';

    console.log(sortBy, 'next', selectedCategory);

    let pipeline;

    //LowToHigh
    switch (sortBy) {
      case 'lowToHigh':
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {

          console.log(selectedCategory);
          pipeline.push({
            $match: {
              "category.name": selectedCategory,
              "category.listed": true
            }
          });
        }

        pipeline.push({ $sort: { offerPrice: 1 } });

        break;

      //HighToLow
      case 'highToLow':
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {
          pipeline.push({
            $match: {
              "category.name": selectedCategory,
              "category.listed": true
            }
          });
        }

        pipeline.push({ $sort: { offerPrice: -1 } });

        break;

      //Aa-Zz
      case 'alphabetical':
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {
          pipeline.push({
            $match: {
              "category.name": selectedCategory,
              "category.listed": true
            }
          });
        }

        pipeline.push({ $sort: { name: 1 } });

        break;

      //Zz-Aa
      case 'analphabetic':
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {
          pipeline.push({
            $match: {
              "category.name": selectedCategory,
              "category.listed": true
            }
          });
        }

        pipeline.push({ $sort: { name: -1 } });

        break;

      //Latest Products
      case 'latest':
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {
          pipeline.push({
            $match: {
              "category.name": selectedCategory,
              "category.listed": true
            }
          });
        }

        pipeline.push({ $sort: { _id: -1 } });

        break;

      default:

        //Category Select
        pipeline = [
          {
            $match: {
              status: false,
              quantity: { $gte: 0 },
              // ...categoryMatch
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categorys"
            }
          },
          {
            $unwind: "$categorys"
          }
        ];

        if (selectedCategory) {
          console.log("Category Selected")
          pipeline.push({
            $match: {
              "categorys.name": selectedCategory,
              "categorys.listed": false,
            }
          });
        }
        break;
    }

    const productss = await Product.aggregate(pipeline);


    res.render('pages/shop', { categories: categories, products: productss, selectedCategory, categoryMatch: selectedCategory })
  } catch (error) {
    console.log(error);
  }
}





//set up product details page
const productDetails = async (req, res) => {
  try {
    const { id } = req.query;

    const pro = await Product.findOne({ _id: id }).populate('category')
    res.render('pages/products', { pro })
  } catch (error) {
    console.log(error);
  }
}


//product search in shop
const searchProducts = async (req, res) => {
  try {

    const { q } = req.query;


    const [products, categories] = await Promise.all([
      Product.find({
        $or: [
          { name: { $regex: new RegExp(q, 'i') } },
        ]
      }),
      Category.find({ name: { $regex: new RegExp(q, 'i') } })
    ]);

    res.render('pages/shop', { products, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



// ==============================set up user Profile=========================

const userProfile = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user })
    console.log(userData);
    res.render('pages/profile', { userData })
  } catch (error) {
    console.log(error);

  }
}

//edit profile
const editProfile = async (req, res) => {
  try {
    const { name, username, mobile } = req.body;

    // Perform any necessary validation or processing here

    // Update the user details in the database
    const user = await User.findOneAndUpdate({ _id: req.session.user }, { name, username, mobile }, { new: true });

    // Assuming you want to redirect to a profile page after submission
    res.redirect('/profile'); // Change this to your desired route
  } catch (error) {
    // Handle errors
    console.error(error);
  }
};


// profile user change password 
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user; // Assuming you store user ID in session

    // Retrieve the user from the database
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
  }
};


//================================== setup addressPage=================================
const addressPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const addressData = await Address.find({ userId: userId })
    if (!userData) {
      return res.status(404).send('User not found');
    }

    res.render('pages/address', { userData, addressData });
  } catch (error) {
    console.error(error);
  }
};


//add address 
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user; // Assuming userId is stored in session
    console.log(userId);
    const {
      name,
      phone,
      pincode,
      locality,
      streetaddress,
      place,
      country,
      state,
      landmark,
      alternatePhone
    } = req.body;

    console.log(name);

    // Create a new address object
    const newAddress = new Address({
      userId: userId,
      name: name,
      phone: phone,
      pincode: pincode,
      locality: locality,
      streetaddress: streetaddress,
      place: place,
      country: country,
      state: state,
      landmark: landmark,
      alternatePhone: alternatePhone
    });

    // Save the new address to the database
    await newAddress.save();


    res.redirect('/profile/address')

  } catch (error) {
    console.error(error);
  }
};


//edit profile address
const editAddress = async (req, res) => {
  try {
    const { addressId, name, phone, streetaddress, place, locality, landmark, country, state, pincode, alternatePhone } = req.body;

    // Update address in the database
    await Address.findByIdAndUpdate(addressId, {
      name,
      phone,
      streetaddress,
      place,
      locality,
      landmark,
      country,
      state,
      pincode,
      alternatePhone
    });

    res.redirect('/profile/address')

    console.log(addressId + "  Address changed");
  } catch (error) {
    console.error(error);
  }
};


//delete address
const deleteAddress = async (req, res) => {
  try {
    const addressId = req.body.id;
    await Address.findByIdAndDelete(addressId);
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error(error);
  }
};

//================================= addtoCart============================

//setup addtoCart
// const addtoCart = async (req, res) => {
//   try {
//     const carts = await Cart.find().populate('products.productId');

//     const cartData = await Cart.findOne({userId : req.session.user});

//     console.log(cartData);

//     res.render('pages/addtoCart', { carts });
//   } catch (error) {
//     console.error('Error fetching carts:', error);
//   }
// };


//======================================set up checkout============================================


// setup checkout page
const checkoutPage = async (req, res) => {
  try {
    console.log("checkoutpage");
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const addressData = await Address.find({ userId: userId })
    const carts = await Cart.find().populate('products.productId');
    if (!userData) {
      return res.status(404).send('User not found');
    }

    res.render('pages/checkout', { userData, addressData, carts });
  } catch (error) {
    console.log(error);

  }
}


//edit checkoutAddress
const editCheckoutAddress = async (req, res) => {
  try {

    const { addressId, name, phone, streetaddress, place, locality, landmark, country, state, pincode, alternatePhone } = req.body;

    // Update address in the database
    await Address.findByIdAndUpdate(addressId, {
      name,
      phone,
      streetaddress,
      place,
      locality,
      landmark,
      country,
      state,
      pincode,
      alternatePhone
    });

    // Redirect to the checkout page or the appropriate page after address is edited
    res.redirect('/checkout');

    console.log(addressId + " Address changed");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error'); // Handle errors appropriately
  }
};


//add address to checkout page
const addCheckoutAddress = async (req, res) => {
  try {
    console.log("add new address");
    const userId = req.session.user; // Assuming userId is stored in session
    console.log(userId);
    const {
      name,
      phone,
      pincode,
      locality,
      streetaddress,
      place,
      country,
      state,
      landmark,
      alternatePhone
    } = req.body;

    console.log(name, " address added in checkout page");

    // Create a new address object
    const newAddress = new Address({
      userId: userId,
      name: name,
      phone: phone,
      pincode: pincode,
      locality: locality,
      streetaddress: streetaddress,
      place: place,
      country: country,
      state: state,
      landmark: landmark,
      alternatePhone: alternatePhone
    });

    // Save the new address to the database
    await newAddress.save();


    res.redirect('/checkout')

  } catch (error) {
    console.error(error);
  }
};


// Place order from checkout

const placeOrder = async (req, res) => {
  try {
    const { userId, address, paymentMethod, totalAmount } = req.body;
    console.log(userId, address, paymentMethod);
    console.log(totalAmount, "diss");

    // Check if payment method is 'wallet'
    if (paymentMethod === 'wallet') {
      // Find the user's wallet
      const userWallet = await Wallet.findOne({ userId: userId });

      if (!userWallet) {
        return res.status(400).json({ status: false, message: "Insufficient balance in wallet." });
      }

      // Check if wallet balance is sufficient
      if (userWallet.balance < totalAmount) {
        return res.status(400).json({ status: false, message: "Insufficient balance in wallet." });
      }

      // Deduct the order amount from the wallet balance
      userWallet.balance -= totalAmount;
      userWallet.transactions.push({
        type: 'debit',
        reason: 'purchased product',
        transactionAmount: totalAmount
      });
      await userWallet.save();
    }

    const ad = await Address.findOne({ userId: req.session.user, _id: address });
    const cart = await Cart.findOne({ userId: req.session.user });
    console.log('this : ' + ad);

    const data = {
      name: ad.name,
      phone: ad.phone,
      pincode: ad.pincode,
      locality: ad.locality,
      streetaddress: ad.streetaddress,
      place: ad.place,
      country: ad.country,
      state: ad.state,
      landmark: ad.landmark
    };

    // Check if totalAmount is below 1000 and if all products are above 1000 Rs
    if (totalAmount < 1000) {
      let allProductsAbove1000 = true;
      for (const product of cart.products) {
        if (product.price < 1000) {
          allProductsAbove1000 = false;
          break;
        }
      }
      if (!allProductsAbove1000) {
        return res.status(400).json({ status: false, message: "Orders with a total amount below 1000 Rs can only include products above 1000 Rs." });
      }
    }

    const newOrder = new Order({
      userId,
      orderUserDetails: data,
      products: cart.products,
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'wallet' ? 'wallet' : 'online',
      paymentStatus: paymentMethod === 'cod' ? 'cod' : "pending",
      totalAmount
    });

    console.log(newOrder, 'dfdfddfdfedfdfdf');

    // Delete product from cart
    await Cart.deleteOne({ userId: req.session.user });

    await newOrder.save();

    // Stock check and decrement
    async function aa() {
      for (const product of newOrder.products) {
        let productId = product.productId;
        let quantity = product.quantity;

        const decrement = await Product.findByIdAndUpdate(productId, { $inc: { quantity: -quantity } });
        console.log(decrement, 'ihciasheud');
      }
    }
    aa();

    // Razorpay
    if (paymentMethod === 'online') {
      var instance = new Razorpay({ key_id: 'rzp_test_2gWPLmDC73KBec', key_secret: 'KXgNwcsIDb4x4y9MJCHmHtaG' });

      const razo = await instance.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: newOrder._id,
      });
      console.log(razo);
      res.json({ status: true, id: razo.id, receipt: razo.receipt, key_id: 'rzp_test_2gWPLmDC73KBec' });
    } else {
      res.json({ status: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "An error occurred while placing your order." });
  }
};



//verify razorpay
const verifyRazo = async (req, res) => {
  try {
    const { order_id, razorpay_payment_id, razorpay_signature, receipt } = req.body;
    console.log(order_id, razorpay_payment_id, razorpay_signature, receipt, "retry payment");
    const secret = "KXgNwcsIDb4x4y9MJCHmHtaG";

    const crypto = require("crypto");
    const hmac = crypto.createHmac('sha256', secret);

    hmac.update(order_id + "|" + razorpay_payment_id);
    let generatedSignature = hmac.digest('hex');
    console.log(generatedSignature, "generateddddddddd");

    let isSignatureValid = generatedSignature == razorpay_signature;

    if (isSignatureValid) {
      console.log(isSignatureValid, "cccc");
      console.log("Payment verified successfully");

      const razoreceipt = await Order.findByIdAndUpdate({ _id: receipt }, { paymentStatus: "paid" });
      console.log(razoreceipt, "recccccccc");


      res.status(200).json({
        message: "Payment verified successfully",
        orderId: order_id, // Send order ID in the response
        totalAmount: totalAmount // Send paid amount in the response

      });
    } else {
      console.log("Invalid signature");
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while verifying payment" });
  }
};


//razorpay failurePage
const failureRazo = async (req, res) => {
  try {
    res.render('pages/failurePage')
  } catch (error) {
    console.log(error);

  }
}


// const successRazo = async (req,res)=>{
//   try {
//     console.log('payment success');
//     res.render('pages/successPage');
//   } catch (error) {
//     console.log(error);

//   }
// }


//retry payment Razorpay
const retryRazo = async (req, res) => {
  try {
    const { orderid } = req.body;
    const details = await Order.findOneAndUpdate(
      { userId: req.session.user, _id: orderid },
      { paymentStatus: "paid" }, // Update payment status to "paid"
      { new: true }
    );
    res.json({ details });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).json({ error: "An error occurred while retrying Razorpay payment" });
  }
};




const updateStatus = async (req, res) => {
  try {
    console.log('sttttttttt');
    const { orderid } = req.body
    console.log("order id", orderid);
    // const update=Order.updateOne({_id:orderid},{$set:{status:"Delivered"}})
    console.log(update);
    res.json({ success: true })
  } catch (error) {
    res.json({ success: true })

  }
}
//======================================set up orderpage============================================


// orders list  in Profile
const orderPage = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user });
    // const orders = await Order.find({ userId: req.session.user }).populate('products.productId').sort({ orderDate: 1 });
    const orderlist = await Order.aggregate([
      {
        $match: {
          userId: new ObjectId(req.session.user)
        }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetail"
        }
      },
      { $unwind: '$productDetail' }
    ]
    )
    // console.log(orderlist);

    res.render('pages/ordersPage', { userData, orderlist });
  } catch (error) {
    console.error(error);
  }
};


//order Details page

const orderDetails = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user });
    const orderId = req.params.orderId;


    const orderDetails = await Order.findOne({ _id: orderId }).populate('products.productId');


    res.render("pages/orderDetail", { userData, orderDetails });
  } catch (error) {
    console.log(error);

  }
};


// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId,'fdfd');
    const order = await Order.findById(orderId);
    console.log(order,'order ');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    if (order.paymentMethod === 'wallet') {
      const userWallet = await Wallet.findOne({ userId: order.userId });

      if (!userWallet) {
        const newWallet = new Wallet({
          userId: order.userId,
          balance: 0, // Set balance to 0 when creating a new wallet
          transactions: [] // Initialize transactions array
        });
        await newWallet.save();
      }
      


        // Refund the amount back to the user's wallet
        userWallet.balance += order.totalAmount;
        userWallet.transactions.push({
          type: 'credit',
          reason: 'refund',
          transactionAmount: order.totalAmount
        });
        await userWallet.save();
      } else if (order.paymentMethod === 'online') {

        const userWallet = await Wallet.findOne({ userId: order.userId });
        
        if (!userWallet) {
          console.log(order.totalAmount,'order.totalAmount');
          const newWallet = new Wallet({
            userId: order.userId,
            balance: order.totalAmount,
            transactions: [{
              type: 'credit',
              reason: 'refund',
              transactionAmount: order.totalAmount
            }]
          });
          await newWallet.save()
        }else{
          userWallet.balance += order.totalAmount;
        userWallet.transactions.push({
          type: 'credit',
          reason: 'refund',
          transactionAmount: order.totalAmount
        });
        await userWallet.save();
      }
        }

      for (const product of order.products) {
        const productId = product.productId;
        const quantity = product.quantity;

        await Product.findByIdAndUpdate(productId, { $inc: { quantity: quantity } });
      }

      // Update order status to Cancelled
      const updatedOrder = await Order.findByIdAndUpdate(orderId, {
        $set: {
          'products.$[].status': 'Cancelled'
        }
      }, { new: true });

      res.status(200).send('Order cancelled successfully');
    
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };





  //return order
  const returnOrder = async (req, res) => {
    try {
      console.log('Return order request received');
      console.log(req.body);
      let { orderId, orderAmount, reason } = req.body; // Assuming orderId is sent from the client
      console.log(orderAmount, reason);
      orderAmount = Number(orderAmount);
      const userId = req.session.user;

      const order = await Order.findByIdAndUpdate(orderId, { status: 'Returned' }, { new: true });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }


      let userWallet = await Wallet.findOne({ userId });


      if (!userWallet) {
        userWallet = new Wallet({
          userId,
          balance: orderAmount,
          transactions: [{
            type: 'credit',
            reason: 'refund',
            transactionAmount: orderAmount,
            returnReason: reason

          }]
        });
      } else {
        // Update wallet balance and add transaction record
        userWallet.balance += orderAmount;
        userWallet.transactions.push({
          type: 'credit',
          reason: 'refund',
          transactionAmount: orderAmount,
          returnReason: reason

        });
      }
      console.log("Cash refund to wallet");

      // Save or update wallet
      await userWallet.save();


      res.status(200).json({ message: 'Return processed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  };



  //set up invoice page
  const invoicePage = async (req, res) => {
    try {
      const userData = await User.findOne({ _id: req.session.user });
      const orderId = req.params.orderId;

      const orderDetails = await Order.findOne({ _id: orderId }).populate('products.productId');


      res.render("pages/invoice", { userData, orderDetails })
    } catch (error) {
      console.log(error);
    }
  }

  //======================================set up coupon============================================


  // coupons set in chekout page
  const getCoupon = async (req, res) => {
    try {
      const currentDate = new Date(); // Get current date/time
      const coupons = await Coupon.find({ expireDate: { $gte: currentDate } });
      if (coupons.length === 0) {
        return res.status(404).json({ message: "No valid coupons found" });
      }
      console.log(coupons, "Get coupon");
      res.json(coupons);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };




  const applyCoupon = async (req, res) => {
    try {
      console.log("show coupons");
      const { couponCode } = req.body;
      console.log(couponCode, 'coupon code');
      const coupon = await Coupon.findOne({ code: couponCode });
      console.log(coupon, 'coupon in apply code apply coupon ');


      if (!coupon) {
        return res.json({ success: false, message: 'Coupon not found' });
      }

      // Check if the coupon has expired
      if (coupon.expireDate && new Date() > coupon.expireDate) {
        return res.json({ success: false, message: 'Coupon has expired' });
      }

      const discountAmount = coupon.discountAmount || 0;
      console.log(discountAmount, 'discount amount in apply code');

      res.json({ success: true, message: 'Coupon applied', discountAmount });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }



  //contact Page
  const contactPage = async (req, res) => {
    try {
      res.render('users/contact')
    } catch (error) {
      console.log(error);

    }
  }

  //about page
  const aboutPage = async (req, res) => {
    try {
      res.render('users/about')
    } catch (error) {
      console.log(error);
    }
  }



  module.exports = {
    loadAuth,
    successGoogleLogin,
    failureLogin,
    securedPassword,
    loadHome,
    loginPage,
    verifyLogin,
    forgotPass,
    forgotVerify,
    sendMailForgotPassword,
    loadConfirmPassword,
    verifyConfirmPassword,
    signUp,
    insertUser,
    otpPage,
    verifyOTP,
    loadResendOtp,
    home,
    logoutHome,
    contactPage,
    aboutPage,




    shopPage,
    searchProducts,
    productDetails,
    userProfile,
    editProfile,
    changePassword,
    addressPage,
    addAddress,
    deleteAddress,
    editAddress,
    checkoutPage,
    editCheckoutAddress,
    addCheckoutAddress,
    placeOrder,
    verifyRazo,
    retryRazo,
    failureRazo,
    updateStatus,
    orderPage,
    orderDetails,
    cancelOrder,
    returnOrder,
    invoicePage,
    getCoupon,
    applyCoupon


  };

  ///
  
const placeOrder = async (req, res) => {
  try {
      log('in place order')
      const userId = req.session.user;
      const { selectedAddress, paymentMethod } = req.body;

      const [address, cart] = await Promise.all([
          Address.findById(selectedAddress),
          Cart.findOne({ userId }).populate({
              path: 'items.productId',
              model: Product,
          }),
      ]);
      log('in place order')

      if (!address) {
          return res.status(400).send("Invalid address selected.");
      }

      if (!cart || cart.items.length === 0) {
          return res.redirect('/serverError');
      }

      const totalAmount = cart.items.reduce((sum, item) => 
          sum + (item.totalPrice || item.productId.salesPrice * item.quantity), 0
      );
      const discountAmount = cart.discountamount || 0;
      const additionalCharges = 0;
      const orderPrice = totalAmount - discountAmount + additionalCharges;

      const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);
      const orderQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      const orderItems = cart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          originalQuantity: item.quantity,
          orderPrice: item.totalPrice || item.productId.salesPrice * item.quantity,
          productPrice: item.productId.salesPrice * item.quantity,
      }));
      log('in place order')

      const newOrder = new Order({
          userId,
          orderUserDetails: userId,
          orderitems: orderItems,
          totalAmount,
          orderPrice,
      paymentMethod: paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : paymentMethod === 'razorpay' ? 'razorpay' : 'wallet',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'cod' : 'pending',
          status: 'Pending',
          orderDate: new Date(),
          address: selectedAddress,
          estimatedDeliveryDate,
          orderQuantity,
      });
log('before saivn')
log(paymentMethod)
      await newOrder.save();
      log('11')
          await Promise.all([
              ...orderItems.map(item =>
                  Product.findByIdAndUpdate(item.productId, {
                      $inc: { quantity: -item.quantity },
                  })
              ),
              ...orderItems.map(item =>
                  Product.findByIdAndUpdate(item.productId, {
                      $inc: { orderCount: item.quantity },
                  })
              ),
              Cart.findOneAndDelete({ userId }),
          ]);
          if (paymentMethod === 'Cash on Delivery') {
              return res.json({ orderId: newOrder._id });
          }
          if (paymentMethod === 'razorpay') {
              log('in rzorpay')
              const razorpayOrder = await razorpay.orders.create({
                  amount: orderPrice * 100, // Amount in paise
                  currency: "INR",
                  receipt: `order_rcptid_${newOrder._id}`,

              });
  log('1')
              // Attach Razorpay order ID to your order
              newOrder.razorpayOrderId = razorpayOrder.id;
              await newOrder.save();
  log('razorpay done')
  log('razorpayOrder:', razorpayOrder);
  
              return res.json({
                  success: true,
                  razorpayOrderId: razorpayOrder.id,
                  orderId: newOrder._id,
                  orderPrice
              });
          } 
          return res.redirect(`/orderConfirmation/${newOrder._id}`);
      
  } catch (error) {
      console.error("Error placing order:", error);
      res.redirect('/serverError');
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity); 
    const userId = req.session.user; 
    console.log(productId, 'Product ID in updateQuantity');
    console.log('Quantity in updateQuantity', quantity);
    console.log('User ID:', userId);

    const product = await Product.findById(productId);
    const salesPrice = product.salesPrice; 

    const totalPrice = quantity * salesPrice; 
    const cart = await Cart.findOneAndUpdate(
      { userId: userId, 'items.productId': productId },
      { 
        $set: { 
          'items.$.quantity': quantity,
          'items.$.totalPrice': totalPrice 
        } 
      },
      { new: true } 
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    let  grandTotal= 0;

    cart.items.forEach(item => {
      const itemTotalPrice = Number(item.totalPrice); 
      if (!isNaN(itemTotalPrice)) {
         grandTotal+= itemTotalPrice; 
      }
    });

    console.log('Grand Total Price:',  grandTotal);
    cart. grandTotal=  grandTotal;
    await cart.save();
    return res.status(200).json({ success: true, cart,  grandTotal}); 

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
  




function updateQuantity(quantityInput, productId, salesPrice, availableStock, productName) {
  const quantity = parseInt(quantityInput.value);
  salesPrice = parseFloat(salesPrice);
  availableStock = parseInt(availableStock);
  const maxLimit = Math.min(availableStock, 10); 

  // Ensure valid input
 
  const totalPriceElement = document.querySelector(`#total-${productId}`);
  const newTotalPrice = quantity * salesPrice;

  if (totalPriceElement) {
    totalPriceElement.innerText = `₹${newTotalPrice.toFixed(2)}`;   
  } else {
    console.error(`Element with ID #total-${productId} not found`);
  }

  updateTotalPrice(quantityInput, salesPrice);
  updateGrandTotal(totalPriceElement);

  fetch(`/cart/update-quantity/${productId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Quantity updated successfully:', data);
      showToast(`Quantity updated successfully for ${productName}`);
    } else {
      alert('Failed to update quantity');
      console.error(data.message);
    }
  })
  .catch(error => {
    console.error('Error updating quantity:', error);
  });
}
        


// const cancelOrder = async (req, res) => {
//     try {
//         const { orderId, orderItemId } = req.params;
//         const { cancelReason, cancellationComments, refundMode } = req.body;

//         const [order, user, categories] = await Promise.all([
//             Order.findById(orderId),
//             User.findById(req.session.user),
//             Category.find({ islisted: true, isDeleted: false }),
//         ]);

//         const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

     
   
//         // Check for unpaid order with Wallet refund mode
//         if (orderItem.paymentStatus !== 'paid' && refundMode === 'wallet') {
//             return res.status(400).send('Cancellation is blocked for unpaid orders with Wallet selected.');
//         }

//         // Proceed with cancellation
//         orderItem.status = 'Cancelled';
//         orderItem.cancelReason = cancelReason;
//         orderItem.cancellationComments = cancellationComments;
//         orderItem.refundMode = refundMode;
//         orderItem.cancelDate = new Date();

//         const refundAmount = orderItem.productPrice * orderItem.originalQuantity;

//         order.orderPrice -= refundAmount;

//         const product = await Product.findById(orderItem.productId);
//         product.quantity += orderItem.originalQuantity;

//         // Handle wallet refund for paid orders
//         if (order.paymentStatus === 'Paid' && refundMode === 'wallet') {
//             let wallet = await Wallet.findOne({ userId: user._id });

//             if (!wallet) {
//                 console.log('Wallet not found, creating a new one.');
//                 wallet = new Wallet({
//                     userId: user._id,
//                     balance: 0,
//                     transactions: [],
//                 });
//             }

//             // Ensure transactions is an array
//             if (!Array.isArray(wallet.transactions)) {
//                 console.error('Wallet transactions is not an array, initializing.');
//                 wallet.transactions = [];
//             }

//             // Add the refund transaction
//             wallet.transactions.push({
//                 type: 'credit',
//                 amount: refundAmount,
//                 description: `Refund for order item ${orderItemId}`,
//             });

//             // Update the wallet balance
//             wallet.balance += refundAmount;

//             await wallet.save();
//             console.log('Wallet updated successfully');
//         }

//         await Promise.all([product.save(), order.save()]);

//         console.log('Order cancellation completed successfully');
//         res.redirect(`/orderDetail/${order._id}/${orderItemId}`);
//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.redirect('/serverError');
//     }
// };


