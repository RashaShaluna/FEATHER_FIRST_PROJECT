const User = require('../models/userSchema');
const bcrypt = require('bcrypt');

// 404 page
const pageNotFound = async(req,res)=>{
  try {
     res.render('page-404');
  } catch (error) {
    res.redirect('/pageNotFound');
      
  }
};


// home page
const loadlandingpage = async (req, res) => {
    try {
      res.render('users/landingpage',{ title: 'Feather - Landingpage' });
      console.log('landing page loaded');
    } catch (error) {
      console.log('Home page not found', error.message); // backend error
      res.status(500).send('Server error'); // frontend error 
    }
  };
  
   
// load home
const loadHome = async (req,res)=>{
  try {
    res.render('users/homepage',{title:'home page'})
  } catch (error) {
    console.log('Home1 page not found', error.message); // backend error
      res.status(500).send('Server error'); // frontend error 
  }
}
  
console.log('welcome to log');

  // register load
  const loadregister = async (req,res)=>{
    console.log('welcome to regsiter');

    try {
      res.render('users/register',{title:'Feather - registerpage'})
      console.log('register page');
      
    } catch (error) {
      console.log('register page not found', error.message); // backend error
      res.status(500).send('Server error'); // frontend error 
    }
    }
 


// register valodation 
const registerVerify = async(req,res)=>{
  const {name,email,password} = req.body;
     try {
       
        const newUser = new User({name,email,password});

        await newUser.save();
        return res.redirect('/home')
     } catch (error) {
      console.log('Login page not found', error.message); // backend error
      res.status(500).send('Server error'); // frontend error 
    } 
     }


// login load
const loadLogin = async (req,res)=>{
  console.log('welcome to login');

  try {
    res.render('users/login',{title:'Feather - loginpage'})
    console.log('login page');
    
  } catch (error) {
    console.log('Login page not found', error.message); // backend error
    res.status(500).send('Server error'); // frontend error 
  }
  }


// verify login
const loginVerify = async(req,res)=>{
  const {email,password} = req.body;
     try{
      

     }catch(error){
      console.log('Login page not found', error.message); // backend error
    res.status(500).send('Server error'); // frontend error 
     }
}









    module.exports = {
      loadlandingpage,
      pageNotFound,
      loadregister,
      registerVerify ,
      loadHome,
      loadLogin,
      // loginVerify
    };