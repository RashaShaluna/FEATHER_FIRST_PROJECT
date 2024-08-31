const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
// const crypto = require('crypto');
const Otp = require('../models/otp');
const jwt = require('jsonwebtoken');


//=============================================404 page========================================================================
const pageNotFound = async (req, res) => {
  try {
    res.render('page-404');
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

// =================================================landing page===============================================================
const loadlandingpage = async (req, res) => {
  try {
    res.render('users/homepage', {title: 'Feather - Homengpage' });
    console.log('landing page loaded');
  } catch (error) {
    console.log('Home page not found', error.message); // backend error
    res.render('pageNotFound',{ title:'Feather - 404'});
  }
};

// ===================================== home page ===========================================================================
// const loadHome = async (req, res) => {
//   try {
//     res.render('users/homepage', { title: 'home page' });
//   } catch (error) {
//     console.log('Home1 page not found', error.message); // backend error
//     res.status(500).send('Server error'); // frontend error 
//   }
// };

// ====================================register load=================================================================
const loadregister = async (req, res) => {
  console.log('welcome to register');

  try {
    res.render('users/register', { title: 'Feather - registerpage' });
    console.log('register page');
  } catch (error) {
    console.log('register page not found', error.message); // backend error
    res.status(500).send('Server error'); // frontend error 
  }
};

//=================================== register validation ========================================
const registerVerify = async (req, res) => {
  try {
    const { name, email, password,cpassword} = req.body;

   
 console.log('verfying1')
    if (password !== cpassword) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'Password do not match'
      });
    }
    console.log('verfying1')

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'User already exists'
      });
    }
    console.log('verfying1')

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);
    console.log('verfying1')

    if (!emailSent) {
      return res.render('users/register', {
        title: 'Feather - registerpage',
        message: 'Email sending failed. Please try again.'
      });
    } 
     req.session.userOtp = otp;
    req.session.userData = {email,password,name};

    // req.session.pass1 = password;
    console.log('User session data:', req.session.userData);

    console.log('otp is ', otp);

    res.render('users/otp', { title: 'OTP Verification' });
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

          if(otp == req.session.userOtp){
  
              const passHash= await bcrypt.hash(user.password, 10);

     console.log('pass',passHash);
        const saveUserData = new User({
                  name: user.name,
                  email: user.email,
                  password: passHash
              })

          console.log('coming to saveuserdata');

          console.log('saveuserdata',saveUserData);

          await saveUserData.save();

        console.log('saved')

          req.session.user = saveUserData._id;
       
          res.json({success:true,redirectUrl:'/'});
         
         }else{
           res.status(400).json({success:false,message:"Invalid OTP ,try again"})
           console.log(error)
         }
         

       }catch (error) {
          console.error(error.message+" error in verifyOtp");
          res.status(500).send("Server error");
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
     res.status(500).json({success:false,message:'Server error  in resent'})
  }
      
};


// ==============================================Login load====================================================================
const loadLogin = async (req, res) => {
 
  console.log('welcome to login');
  try {
    res.render('users/login', { title: 'Feather - loginpage' });
    console.log('login page');
  } catch (error) {
    console.log('Login page not found', error.message); 
    res.status(500).send('Server error'); 
  }
};


//===================================================Verify login================================================================
const loginVerify = async (req, res) => {
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
      return res.render('users/login', { title: 'Feather - loginpage', message });
    }

    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      console.log('User not found');
      return res.render('users/login', { title: 'Feather - loginpage', message: 'User not found' });
    }

    if (findUser.isBlocked) {
      return res.render('users/login', { title: 'Feather - loginpage', message: 'User is blocked by admin' });
    }

    console.log('Password from request:', req.body.password);
    console.log('Hashed password from DB:', findUser.password);

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render('users/login', { title: 'Feather - loginpage', message: 'Incorrect Password' });
    }

    req.session.user = findUser._id;
    res.redirect('/');

  } catch (error) {
    console.log('Login page not found', error.message); 
    res.render('users/login', { title: 'Feather - loginpage', message: 'Login failed, please try again' });
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
    return res.status(500).json({ success: false, message: 'Server error' });
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


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
      res.status(500).json({succes:false,message:'Server error'});
    }
}

// =================================================== successpass ==================================================
const successpass = async (req,res) => {
       try {
         res.render('users/successpass')
       } catch (error) {
        console.log('error in successpass',error);
        return res.status(400).json({ success: false, message: 'Error in success pass' });
       }
}


//==================================================== shop =============================================================


const mini= async(req,res)=>{
  try {
    res.render('users/minibag',{title:'Shop Page - Feather'});
  } catch (error) {
    console.log('error in shop');
    res.redirect('/pageNotFound');
  }
}

const cross= async(req,res)=>{
  try {
    res.render('users/crossbag',{title:'Shop Page - Feather'});
  } catch (error) {
    console.log('error in shop');
    res.redirect('/pageNotFound');
  }
}

const tote= async(req,res)=>{
  try {
    res.render('users/totebag',{title:'Shop Page - Feather'});
  } catch (error) {
    console.log('error in shop');
    res.redirect('/pageNotFound');
  }
}















module.exports = {
  loadlandingpage,
  pageNotFound,
  loadregister,
  registerVerify,
  // loadHome,
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
 mini,
 cross,
 tote
};




