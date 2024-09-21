const User = require('../models/userSchema');
const Product = require('../models/productModel');
const Category = require('../models/category');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
// const crypto = require('crypto');
const Otp = require('../models/otp');
const jwt = require('jsonwebtoken');
const {log} = require('console');
const flash = require('connect-flash');
const Cart = require('../models/cartModel');
//=============================================404 page========================================================================
const pageNotFound = async (req, res) => {
  try {
    res.render('pages/page-404');
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

//============================================= 500 page========================================================================
const serverError =async(req,res)=>{
  try {
    res.render('pages/server-500');
  } catch (error) {
    log(error )
    res.redirect('/serverError');
  }
}


// =================================================landing page===============================================================
const loadlandingpage = async (req, res) => {
  try {
    console.log(req.session); // Check if session is being persisted
    const categories = await Category.find({ islisted: true, isDeleted: false });
    const products = await Product.find({isBlocked:false,isDeleted:false}).limit(4);
    // log('product',products)
    res.render('users/landingpage', {title: 'Feather - Homengpage' ,
       products: products,
       categories: categories,
      });
    console.log('landing page loaded');
  } catch (error) {
    console.log('Home page not found', error.message); // backend error
    res.redirect('/pageNotFound');
  }
};

// ============================== Home page ==================================================

const loadHome = async (req, res) => {
  try {
    log('home page loaded');

    console.log(req.session); // Check if session is being persisted
    const categories = await Category.find({ islisted: true, isDeleted: false });
    const user = req.session.user ;
    log(user)
    const products = await Product.find({isBlocked:false,isDeleted:false}).limit(4);
    // log('product',products)

    res.render('users/homepage', {title: 'Feather - Homengpage' ,
       products: products,
       categories: categories,
      });
  } catch (error) {
    console.log('Home page not found', error); 
    res.redirect('/pageNotFound');
  }
};



// ====================================register load=================================================================
const loadregister = async (req, res) => {
  console.log('welcome to register');

  try {
    const categories = await Category.find({ islisted: true, isDeleted: false });
    // log(categories)
    res.render('users/register', { title: 'Feather - registerpage' ,categories: categories});
    console.log('register page');
  } catch (error) {
    console.log('register page not found', error.message); 
    res.redirect('/pageNotFound');
  }
};

//=================================== register validation ========================================
const registerVerify = async (req, res) => {
  try {
    const { name, email, password,cpassword,phone} = req.body;
    const categories = await Category.find({ islisted: true, isDeleted: false });

   
 console.log('verfying1')
    if (password !== cpassword) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'Password do not match',
        categories: categories
      });
    }
    console.log('verfying1')

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'User already exists',
        categories: categories
      });
    }
    console.log('verfying1')

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);
    console.log('verfying1')
    if (!email || email.trim() === '') {
      return res.render('users/register', {
       title: 'Feather - registerpage',
       message: 'All feilds required',
     });
   }
    if (!emailSent) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'Email sending failed. Please try again.',
        categories: categories
      });
    } 
     req.session.userOtp = otp;
    req.session.userData = {email,password,name,phone};

    // req.session.pass1 = password;
    console.log('User session data:', req.session.userData);

    console.log('otp is ', otp);

    res.render('users/otp', { title: 'OTP Verification',});
  } catch (error) {
    console.log('Verifying register has a problem', error); // backend error
    res.redirect('/pageNotFound');
  }
};

//  OTP generation

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

console.log('otp generated');

// Email sending verification
async function sendVerificationEmail(email, otp ) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });

    // Email data and subject displaying
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Verifying your account',
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp} </b>`
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.log('Error sending email', error);
    return false;
  }
}

//====================================================== veriyin otp==========================================================
const verifyOtp = async(req,res)=>{
      try {
        console.log('session ',req.session);
          const {otp} = req.body;
        console.log('req',req.body);
          console.log('otp in verify ',otp);  
          const user = req.session.userData
           console.log(req.session.userOtp);
          console.log('user',user);
          const categories = await Category.find({ islisted: true, isDeleted: false });
          const products = await Product.find({isBlocked:false,isDeleted:false});
          if(otp == req.session.userOtp){
              const passHash= await bcrypt.hash(user.password, 10);
     console.log('pass',passHash);
        const saveUserData = new User({
                  name: user.name,
                  email: user.email,
                  password: passHash,
                  phone:user.phone
              })
          console.log('coming to saveuserdata');
          console.log('saveuserdata',saveUserData);
          await saveUserData.save();
        
        console.log('saved')

          req.session.user = saveUserData._id;
          res.render('users/home', { success:true,title: 'Home page -Feather',categories, products});
         }else{
           res.status(400).json({success:false,message:"Invalid OTP ,try again"})
           console.log(error)
         }
       }catch (error) {
          console.error(error.message+" error in verifyOtp");
          res.redirect('/serverError');
        }
  }

// ======================================================= Resend otp ============================================================ 
const resendOtp =   async (req,res) => {
  console.log('im in resend ');
  
  try {
    
     console.log('re1')
    const {email} = req.session.userData;  
    console.log('re1')

      if(!email){
        return res.status(400).json({ success: false, message: 'Email is not found in session ' });
      }
      console.log('re1')

      const otp = generateOtp();
      console.log('generated')

      req.session.userOtp = otp ;

    const emailSent = await   sendVerificationEmail(email,otp);
          
    if (emailSent) {
      console.log('OTP resent successfully:', otp);
      res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } else {
      console.error('Failed to resend OTP');
      res.status(500).json({ success: false, message: 'Failed to send OTP, please try again' });
    }
}
   catch (error) {
     console.error("error in resending",error);
     res.redirect('/serverError');
    }
      
};


// ==============================================Login load====================================================================
const loadLogin = async (req, res) => {
 
  console.log('welcome to login');
  try {
    const categories = await Category.find({ islisted: true, isDeleted: false });
    // log(categories)
    res.render('users/login', { title: 'Feather - loginpage',categories: categories });
    console.log('login page');
  } catch (error) {
    console.log('Login page not found', error.message); 
    res.redirect('/pageNotFound');
  }
};


//===================================================Verify login================================================================
const loginVerify = async (req, res) => {
  log('verifyinh it')
  const categories = await Category.find({ islisted: true, isDeleted: false });
  // console.log('Categories:', categories);
  const products = await Product.find({ isBlocked: false, isDeleted: false }).limit(4);
  // console.log('Products:', products);


  try {
    console.log('Req body:', req.body); 
    const { email, password } = req.body;

  
    console.log('log1');
    
    if (!email || !password) {
      const message = !email && !password 
        ? 'Email and Password are required'
        : !email 
        ? 'Email is required'
        : 'Password is required';
      return res.render('users/login', { title: 'Feather - loginpage', message ,categories, products});
    }

    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      console.log('User not found');
      return res.render('users/login', { title: 'Feather - loginpage', message: 'User not found' ,categories, products});
    }

    if (findUser.isBlocked) {
      return res.render('users/login', { title: 'Feather - loginpage', message: 'User is blocked by admin' ,categories, products});
    }

    console.log('Password from request:', req.body.password);
    console.log('Hashed password from DB:', findUser.password);

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render('users/login', { title: 'Feather - loginpage', message: 'Incorrect Password' ,categories, products});
    }
 
      req.session.user = findUser._id;
      // req.session.user.save();
      log('saved')
     res.redirect('/home');

    // res.render('users/homepage', { title: 'Home page -Feather',categories, products});

  } catch (error) {
    console.log('Login page not found', error.message); 
    res.render('users/login', { title: 'Feather - loginpage', message: 'Login failed, please try again',categories, products});
  }
};



//=============================================Logout=======================================================================
const logOut = async(req,res)=>{

try{
  console.log(' in log out')
  req.session.destroy((err)=>{
    if(err){
      console.log('Error in logout the session');
      return res.redirect('/pageNotFound'); 
    }
    console.log('session distroyed')
    return res.redirect('/');
  })
}catch(error){
  console.log('Log out error');
  res.redirect('/pageNotFound')
}

}

//=======================================================Forgot password========================================================
const forgotpass = async(req,res)=>{
  try {
    console.log('in forgot log');
    res.render('users/forgotepass',{title:'Feather - forgot password'});
  } catch (error) {
    console.log('error in loading forgot')
    res.redirect('/pageNotFound')
  }
}

//======================================================Sending Link==================================================================================

// const forgot = async (req, res) => {
//   try {
//     console.log('in forgot');
//     const {email } = req.body;
//   console.log('req', req.body);

//     // if (!email) {
//     //   return res.render('users/forgotepass',{title:'Feather - Forgot password', message: 'Email is required' });
//     // }
//     if (!email) {
//       console.log('No email provided');
//       return res.render('users/forgotepass', { title: 'Feather - Forgot password', message: 'Email is required' });
//     }
    
//     console.log('Looking for user with email:', email);

//     const findUser = await User.findOne({email});
// // if (!email) {
// //   console.log('No email provided');
// //   // return res.render('users/forgotepass', { title: 'Feather - Forgot password', message: 'Email is required' });
// //   return res.render('users/forgotepass', { title: 'Feather - Forgot password', message: 'Email is required' });

// // }

//     if (!findUser) {
//       console.log('User not found for email:', email);
//       return res.render('users/forgotepass', { title: 'Feather - Forgot password', message: 'User not found' });
//     }
//     console.log('User found:', findUser);

//     const secret = process.env.JWT_SECRET + findUser.password;
//     const payLoad = {
//       email: findUser.email,
//       id: findUser._id
//     };
//     const token = jwt.sign(payLoad, secret, { expiresIn: '30m' });

//     // creating the resnt link
//     const link = `http://localhost:4000/resetPass/${findUser._id}/${token}`;
//     console.log(link);

//     // send the email
//     const emailSent = await sendLink  (email, link);

//     // if (!emailSent) {
//     //   return res.status(500).json({ success:false, message: 'Failed to send email' });
//     // }else{
//     //   return res.json({ success: true, message: 'Link sent successfully' });
//     // }
//     if (emailSent) {
//       return res.json({ success: true, message: 'Link sent successfully' });
//     }else{
//       return res.status(500).json({ success:false, message: 'Failed to send email' });

//     }



//   } catch (error) {
//     console.log('Error in forgot password:', error);
//     return res.status(500).json({ success:false, message: 'Server error' });
//   }
// };
const forgot = async (req, res) => {
  try {
    console.log('in forgot');
    const { email } = req.body;
    console.log('req', req.body);

    if (!email) {
      console.log('No email provided');
      return res.json({ success: false, message: 'Email is required' });
    }

    console.log('Looking for user with email:', email);
    const findUser = await User.findOne({ email });

    if (!findUser) {
      console.log('User not found for email:', email);
      return res.json({ success: false, message: 'User not found' });
    }

    console.log('User found:', findUser);
    const secret = process.env.JWT_SECRET + findUser.password;
    const payLoad = { email: findUser.email, id: findUser._id };
    const token = jwt.sign(payLoad, secret, { expiresIn: '30m' });

    // Create the reset link
    const link = `http://localhost:4000/resetPass/${findUser._id}/${token}`;
    console.log(link);

    // Send the email
    const emailSent = await sendLink(email, link);

    if (emailSent) {
      return res.json({ success: true, message: `Link sent successfully to your mail ${email}`});
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.log('Error in forgot password:', error);
    res.redirect('/serverError');
  }
};

// sending link via email
async function sendLink(email, link) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Reset Password',
      text: `Your link to reset password is ${link}`,
      html: `<b>Your link ${link} </b>`
    });

    return true; 
  } catch (error) {
    console.log('Error in sending verification email:', error);
    return false; 
  }
}


// ========================Reseting password token=================================================================================================

const resetPass = async (req, res) => {
  const { _id, token } = req.params;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Id' });
    }

    const secret = process.env.JWT_SECRET + user.password;
    try {
      const payLoad = jwt.verify(token, secret);
      res.render('users/resetpass', { email: user.email,title:"Feather - reset password" });
    } catch (error) {
      console.log('Token verification error:', error);
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.log('Error in reset password:', error);
    res.redirect('/serverError')
  }
};


// ======================================================================== conform password ===============================================
const confirmpass = async(req,res)=>{  
    try {
      const { _id, token } = req.params;
      const {password , confirmPassword} = req.body;

          console.log('req',req.body)

      const user = await User.findById(_id);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid Id' });
      }

      const secret = process.env.JWT_SECRET + user.password;
      try {
        const payLoad = jwt.verify(token, secret);
        // res.render('users/resetpass', { email: user.email,title:"Feather - reset password" });  
      } catch (error) {
        console.log('Token verification error:', error);
        return res.status(400).json({ success: false, message: 'Invalid or expired token' });
      } 
      
       
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
      const hashnew = await bcrypt.hash(password,10);
       console.log('hasnew:',hashnew);
      user.password = hashnew;
      await user.save()
       console.log('saved');

       res.render('users/successpass',{title:'Feather - forgot password'});
      
    } catch (error) {
      console.log('Error in confirm pass',error)
    return   res.redirect('/serverError');
    }
}

// =================================================== successpass ==================================================
const successpass = async (req,res) => {
       try {
         res.render('users/successpass')
       } catch (error) {
        console.log('error in successpass',error);
      return  res.redirect('/pageNotFound');
      }
}


//==================================================== shop =============================================================

// const shop = async (req, res) => {
//   try {
//     log('in shop');
//     const user = req.session.user;
//     log('user', user);

//     const categories = await Category.aggregate([
//       {
//         $match: { isDeleted: false, islisted: true }
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: '_id',
//           foreignField: 'category',
//           as: 'products'
//         }
//       },
//       {
//         $addFields: {
//           productCount: { $size: "$products" }
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           slug: 1,
//           productCount: 1
//         }
//       }
//     ]);
//     log('cat', categories);

//     const page = parseInt(req.query.page) || 1;
//     const limit = 6;
//     const skip = (page - 1) * limit;
//     const sort = req.query.sort || 'Featured'; 
//     const categoryId = req.params.categoryId || '';
  
//     let products = [];
//     let totalProducts = 0;
//     let categoryName = '';
//     let colors = [];
//     let sortOptions = {};

//     switch (sort) {
//       case 'a-z':
//         sortOptions = { name: 1 };
//         break;
//       case 'z-a':
//         sortOptions = { name: -1 };
//         break;
//       case 'low-high':
//         sortOptions = { price: 1 };
//         break;
//       case 'high-low':
//         sortOptions = { price: -1 };
//         break;
//       case 'popularity':
//         sortOptions = { popularity: -1 }; 
//         break;
//       case 'newest':
//         sortOptions = { createdAt: -1 }; 
//         break;
//       default:
//         sortOptions = { featured: 1 }; 
//         break;
//     }
   

//     if (categoryId) {
//       const category = await Category.findOne({ _id: categoryId, islisted: true, isDeleted: false });
//       log('categor', category);
//       if (category) {
//         categoryName = category.name;
//       }
//       log('categoryName', categoryName);


      
      
//       totalProducts = await Product.countDocuments({
//         category: categoryId,
//         isBlocked: false,
//         isDeleted: false
//       });

//       products = await Product.find({
//         category: categoryId,
//         isBlocked: false,
//         isDeleted: false
//       })
//       .sort(sortOptions)
//       .limit(limit)
//       .skip(skip);
      
//       colors = await Product.distinct('color', {
//         category: categoryId,
//         isBlocked: false,
//         isDeleted: false
//       });
//       log('c', colors);
//     } else {
      
//       totalProducts = await Product.countDocuments({
//         isBlocked: false,
//         isDeleted: false
//       });

//       products = await Product.find({
//         isBlocked: false,
//         isDeleted: false
//       })
//       .sort(sortOptions)
//       .limit(limit)
//       .skip(skip);

//       colors = await Product.distinct('color', {
//         isBlocked: false,
//         isDeleted: false
//       });
//       log('c', colors);

//     }
  
//     const totalPages = Math.ceil(totalProducts / limit);

//     res.render('users/shop', {
//       title: 'Shop - Feather',
//       categories,
//       products,
//       currentPage: page,
//       totalPages,
//       categoryName,
//       colors,
//       user: user,
//       sort, // Pass sort parameter
//       categoryId, // Pass categoryId parameter
      
//     });

//   } catch (err) {
//     console.error(err);
//     return res.redirect('/pageNotFound');
//   }
// };



// const shop = async (req, res) => {
//   try {
//     const user = req.session.user;
//     const cat = req.params.categoryId;

//     const categories = await Category.aggregate([
//       {
//         $match: { isDeleted: false, islisted: true }
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: '_id',
//           foreignField: 'category',
//           as: 'products'
//         }
//       },
//       {
//         $addFields: {
//           productCount: { $size: "$products" }
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           slug: 1,
//           productCount: 1
//         }
//       }
//     ]);

//     const page = parseInt(req.query.page) || 1;
//     const limit = 6;
//     const skip = (page - 1) * limit;
//     const sort = req.query.sort || 'Featured'; 
//     const categoryId = req.params.categoryId || '';
//     log('category id', categoryId);
//     const selectedColors = req.query.colors ? req.query.colors.split(',') : [];

//     let products = [];
//     let totalProducts = 0;
//     let categoryName = '';
//     let colors = [];
//     let sortOptions = {};
//     // let colorCounts = {}; 
//     switch (sort) {
//       case 'a-z':
//         sortOptions = { name: 1 };
//         break;
//       case 'z-a':
//         sortOptions = { name: -1 };
//         break;
//       case 'low-high':
//         sortOptions = { price: 1 };
//         break;
//       case 'high-low':
//         sortOptions = { price: -1 };
//         break;
//       case 'popularity':
//         sortOptions = { popularity: -1 }; 
//         break;
//       case 'newest':
//         sortOptions = { createdAt: -1 }; 
//         break;
//       default:
//         sortOptions = { featured: 1 }; 
//         break;
//     }

//     let query = {
//       isBlocked: false,
//       isDeleted: false
//     };

//     if (categoryId) {
//       query.category = categoryId;
//       log(categoryId)
//       const category = await Category.findOne({ _id: categoryId, islisted: true, isDeleted: false });
//       if (category) {
//         categoryName = category.name;
//       }

//       if (selectedColors.length > 0) {
//         query.color = { $in: selectedColors };
//       }

//       totalProducts = await Product.countDocuments(query);
//       products = await Product.find(query)
//         .sort(sortOptions)
//         .limit(limit)
//         .skip(skip);
      
//         colors = await Product.distinct('color', {
//           category: categoryId,
//           isBlocked: { $ne: true },
//           isDeleted: { $ne: true }
//         });
//               colors.sort((a, b) => a.localeCompare(b));

//         log(colors)
       

//     } else {
//       if (selectedColors.length > 0) {
//         query.color = { $in: selectedColors };
//       }

//       totalProducts = await Product.countDocuments(query);
//       products = await Product.find(query)
//         .sort(sortOptions)
//         .limit(limit)
//         .skip(skip);
      
//         colors = await Product.distinct('color', {
//           category: categoryId,
//           isBlocked: { $ne: true },
//           isDeleted: { $ne: true }
//         });
//         colors.sort((a, b) => a.localeCompare(b));
//       }
//     const totalPages = Math.ceil(totalProducts / limit);

//     res.render('users/shop', {
//       title: 'Shop - Feather',
//       categories,
//       products,
//       currentPage: page,
//       totalPages,
//       categoryName,
//       colors,
//       user: user,
//       sort, 
//       categoryId, 
//       // colorCounts,
//       selectedColors
//     });
//   } catch (err) {
//     console.error(err);
//     return res.redirect('/pageNotFound');
//   }
// };

const shop = async (req, res) => {
  try {
    log('in shop')
    const user = req.session.user;
    log(user)
    
    // const userId = user ? user._id : null; 
    // log('userId',userId)

    const categories = await Category.aggregate([
      {
        $match: { isDeleted: false, islisted: true }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: "$products" }
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          productCount: 1
        }
      }
    ]);
 
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'Featured';
    const categoryId = req.params.categoryId || '';
    const selectedColors = req.query.colors ? req.query.colors.split(',') : [];
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;log(minPrice);

    // // wishlist
    // const wishlist = user ? await getWishlist(user) : { products: [] }; // Handle missing userId
    // const isInWishlist = wishlist.products.some(p => p.productsId.toString() === productId);
 
     // Get cart items if user is logged in
    //  const cart = await Cart.findOne({ user: userId });
    //  const cartProductIds = cartItems.map(item => item.productId.toString());
 
    // const cart = await Cart.findOne({ user: userI }).populate('items.productId');
    // const isInCart = cart ? cart.items.map(item => item.productId.toString()) : [];

    // console.log('Product:', product);
    // console.log('Cart:', cart);
    

    let products = [];
    let totalProducts = 0;
    let categoryName = '';
    let colors = [];
    let sortOptions = {};

    switch (sort) {
      case 'a-z':
        sortOptions = { name: 1 };
        break;
      case 'z-a':
        sortOptions = { name: -1 };
        break;
      case 'low-high':
        sortOptions = { offerprice: 1 };
        break;
      case 'high-low':
        sortOptions = { offerprice: -1 };
        break;
      case 'popularity':
        sortOptions = { popularity: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { featured: 1 };
        break;
    }

    let query = {
      isBlocked: false,
      isDeleted: false,
      offerprice: { $gte: minPrice, $lte: maxPrice }
    };

    if (categoryId) {
      query.category = categoryId;
      const category = await Category.findOne({ _id: categoryId, islisted: true, isDeleted: false });
      if (category) {
        categoryName = category.name;
      }

      if (selectedColors.length > 0) {
        query.color = { $in: selectedColors };
      }

      totalProducts = await Product.countDocuments(query);
      products = await Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip);

      colors = await Product.distinct('color', {
        category: categoryId,
        isBlocked: { $ne: true },
        isDeleted: { $ne: true }
      });
      colors.sort((a, b) => a.localeCompare(b));

    } else {
      if (selectedColors.length > 0) {
        query.color = { $in: selectedColors };
      }

      totalProducts = await Product.countDocuments(query);
      products = await Product.find(query)
        .sort(sortOptions)
        .limit(limit)
        .skip(skip);

      colors = await Product.distinct('color', {
        isBlocked: { $ne: true },
        isDeleted: { $ne: true }
      });
      colors.sort((a, b) => a.localeCompare(b));
    }

    const totalPages = Math.ceil(totalProducts / limit);

    res.render('users/shop', {
      title: 'Shop - Feather',
      categories,
      products,
      currentPage: page,
      totalPages,
      categoryName,
      colors,
      user: user,
      sort,
      categoryId,
      selectedColors,
      minPrice,
      maxPrice,
      // product,
      // cartProductIds
      // isInCart
      // isInWishlist
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/pageNotFound');
  }
};
// const shop = async (req, res) => {
//   try {
//     //     log('in shop')
//     const user = req.session.user;
//      log('user',user);

//     const categories = await Category.aggregate([
//       {
//         $match: { isDeleted: false, islisted: true }
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: '_id',
//           foreignField: 'category',
//           as: 'products'
//         }
//       },
//       {
//         $addFields: {
//           productCount: { $size: "$products" }
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           slug: 1,
//           productCount: 1
//         }
//       }
//     ]);

//     const page = parseInt(req.query.page) || 1;
//     const limit = 6;
//     const skip = (page - 1) * limit;
//     const sort = req.query.sort || 'Featured';
//     const categoryId = req.params.categoryId || '';
//     const selectedColors = req.query.colors ? req.query.colors.split(',') : [];
//     const minPrice = parseFloat(req.query.minPrice) || 0;
//     const maxPrice = parseFloat(req.query.maxPrice) || Infinity;log(minPrice);
//     log(maxPrice)
  
//     let products = [];
//     let totalProducts = 0;
//     let categoryName = '';
//     let colors = [];
//     let sortOptions = {};

//     switch (sort) {
//       case 'a-z':
//         sortOptions = { name: 1 };
//         break;
//       case 'z-a':
//         sortOptions = { name: -1 };
//         break;
//       case 'low-high':
//         sortOptions = { offerprice: 1 };
//         break;
//       case 'high-low':
//         sortOptions = { offerprice: -1 };
//         break;
//       case 'popularity':
//         sortOptions = { popularity: -1 };
//         break;
//       case 'newest':
//         sortOptions = { createdAt: -1 };
//         break;
//       default:
//         sortOptions = { featured: 1 };
//         break;
//     }

//     let query = {
//       isBlocked: false,
//       isDeleted: false,
//       offerprice: { $gte: minPrice, $lte: maxPrice }
//     };

//     if (categoryId) {
//       query.category = categoryId;
//       const category = await Category.findOne({ _id: categoryId, islisted: true, isDeleted: false });
//       if (category) {
//         categoryName = category.name;
//       }

//       if (selectedColors.length > 0) {
//         query.color = { $in: selectedColors };
//       }

//       totalProducts = await Product.countDocuments(query);
//       products = await Product.find(query)
//         .sort(sortOptions)
//         .limit(limit)
//         .skip(skip);

//       colors = await Product.distinct('color', {
//         category: categoryId,
//         isBlocked: { $ne: true },
//         isDeleted: { $ne: true }
//       });
//       colors.sort((a, b) => a.localeCompare(b));

//     } else {
//       if (selectedColors.length > 0) {
//         query.color = { $in: selectedColors };
//       }

//       totalProducts = await Product.countDocuments(query);
//       products = await Product.find(query)
//         .sort(sortOptions)
//         .limit(limit)
//         .skip(skip);

//       colors = await Product.distinct('color', {
//         isBlocked: { $ne: true },
//         isDeleted: { $ne: true }
//       });
//       colors.sort((a, b) => a.localeCompare(b));
//     }

//     const totalPages = Math.ceil(totalProducts / limit);

//     res.render('users/shop', {
//       title: 'Shop - Feather',
//       categories,
//       products,
//       currentPage: page,
//       totalPages,
//       categoryName,
//       colors,
//       user: user,
//       sort,
//       categoryId,
//       selectedColors,
//       minPrice,
//       maxPrice
//     });
//   } catch (err) {
//     console.error(err);
//     return res.redirect('/pageNotFound');
//   }
// };  this is form git 
// ========================================================================= Product single view ==================================================================
const productView = async (req, res) => {
  try {
      log('in product');
      const productId = req.params.id; 
      log('product id', productId);

      const product = await Product.findOne({
          _id: productId,
          isBlocked: false,    
          isDeleted: false     
      }).populate({
          path: 'category',
          match: { isDeleted: false, islisted: true } 
      });

      log('product', product);

      if (!product || !product.category) {
        return res.status(404).render('404', { message: 'Product or category not found' });
    }
    const categories = await Category.find({ islisted: true, isDeleted: false });
    log('cat', categories)

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      // category: product.category._id,
      isBlocked: false,
      isDeleted: false
    }).limit(4); 

      res.render('users/productDetails', {
        title: `${product.name} - Feather`,
        product,
        categories,
        relatedProducts,
      });
    } catch (error) {
      log(error);
     return res.redirect('/pageNotFound');
    }
};


// ======================================================== User profile ===================================================
const userProfile = async (req, res) => {
  try {
    log('in profile');
    console.log('Session user:', req.session.user);

    const userId =  req.session.user;
    log('userid', userId);
    
    if(userId){
      const user = await User.findOne({ _id: userId, isBlocked: false });
      log('user', user);
      const categories = await Category.find({ islisted: true, isDeleted: false });
      log('in profile 2')
     return  res.render('users/userProfile', {
        title: 'Account - Feather',
        activeTab: 'account-details', 
        categories: categories,
        user: user
      });
    }else{
     res.redirect('/pageNotFound');
    }
   
  } catch (error) {
    console.error(error);
    return res.redirect('/serverError');

  }
};


// ======================================================== edit profile ===================================================
const editProfile = async (req, res) => {
  try {
    log('in edit profile');
    console.log('Session user:', req.session.user);

    const userId =  req.session.user;
    log('userid', userId);
    
    if(userId){
      const user = await User.findOne({ _id: userId, isBlocked: false });
      log('user', user);
      const categories = await Category.find({ islisted: true, isDeleted: false });
      log('in profile 2')
     return  res.render('users/editprofile', {
        title: 'Edit account - Feather',
        activeTab: 'account-details', 
        categories: categories,
        user: user
      });
    }else{
     res.redirect('/pageNotFound');
    }
   
  } catch (error) {
    console.error(error);
    return res.redirect('/serverError');

  }
};

// ====================================================== upadating profile ================================================
const updateprofile = async (req, res) => {
  try {
    const userId = req.session.user; 
    log('userId:', userId);

    const { name, email, phone, password, confirmPassword, currentPassword } = req.body;
    log('req.body:', req.body);

    const categories = await Category.find({ islisted: true, isDeleted: false });

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/serverError');
    }
    let isMatch;
    if (currentPassword) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.render('users/editprofile', {
          title: 'Account - Feather',
          message: 'Current password is incorrect',
          activeTab: 'account-details' ,
          categories: categories,
          user: user,
        });
      }
    }
    let hashedPassword = null;
    if (password && confirmPassword) {
      if (password !== confirmPassword) {
        return res.render('users/editprofile', {
          title: 'Account - Feather',
          message: 'New passwords do not match',
          activeTab: 'account-details' ,
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
    log('update data:', updateData);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    log('saved:', updatedUser);

    if (updatedUser) {
      req.session.userData = updatedUser; 
      return res.render('users/userProfile', {
        title: 'Account - Feather',
        activeTab: 'account-details' ,
        categories: categories,
        user: updatedUser,
      });
    } else {
      res.redirect('/serverError');
    }
  } catch (error) {
    console.log('error:', error);
    res.redirect('/serverError');
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




