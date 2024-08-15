const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
// const crypto = require('crypto');
const Otp = require('../models/otp');


// 404 page
const pageNotFound = async (req, res) => {
  try {
    res.render('page-404');
  } catch (error) {
    res.redirect('/pageNotFound');
  }
};

// home page
const loadlandingpage = async (req, res) => {
  try {
    res.render('users/landingpage', { title: 'Feather - Landingpage' });
    console.log('landing page loaded');
  } catch (error) {
    console.log('Home page not found', error.message); // backend error
    res.render('pageNotFound',{ title:'Feather - 404'});
  }
};

// load home
const loadHome = async (req, res) => {
  try {
    res.render('users/homepage', { title: 'home page' });
  } catch (error) {
    console.log('Home1 page not found', error.message); // backend error
    res.status(500).send('Server error'); // frontend error 
  }
};

// register load
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

// register validation 
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

// OTP generation
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

// veriyin otp
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
       
          res.json({success:true,redirectUrl:'/home'});
         
         }else{
           res.status(400).json({success:false,message:"Invalid OTP ,try again"})
           console.log(error)
         }
         

       }catch (error) {
          console.error(error.message+" error in verifyOtp");
          res.status(500).send("Server error");
      }
  }


// resend otp 

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


//  login load
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

// verify login
const loginVerify = async (req, res) => {
  try {
    console.log('Req body:', req.body); 
    const { email, password } = req.body;

      console.log('log1');
       
      const findUser = await User.findOne({isAdmin:0,email:email});

      if (!password) {
        console.log('Password is missing');
        return res.render('users/login', { title: 'Feather - loginpage', message: 'Password is required' });
    }

    if (!email) {
      console.log('email is missing');
      return res.render('users/login', { title: 'Feather - loginpage', message: 'email is required' });
  }

  if (!email||!password) {
    console.log('both ARE is missing');
    return res.render('users/login', { title: 'Feather - loginpage', message: 'Email and Password is required' });
}

      if(!findUser){
     console.log('User not find');
     res.render('users/login', { title: 'Feather - loginpage',message:'User not find ' });
    }
    console.log('Found user:', findUser);

    if(findUser.isBlocked){
      res.render('users/login', { title: 'Feather - loginpage',message:'User is blocked by admin' });
    }
    console.log('Password from request:', req.body.password);
    console.log('Hashed password from DB:', findUser.password);


    if (!password) {
      throw new Error('Password is undefined');
  }

  const passwordMatch = await bcrypt.compare(password, findUser.password);

    if(!passwordMatch){
      res.render('users/login', { title: 'Feather - loginpage',message:'Incorrect Password ' });
    }
    
      req.session.user = findUser._id;
      res.redirect('/home');

  } catch (error) {
    console.log('Login page not found', error.message); // backend error
    res.render('users/login', { title: 'Feather - loginpage',message:'Login failed , Please try again' });
  }
};

// logout
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
  logOut
};




