// const User = require('../models/userSchema');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');


// const loadLoginadmin = async (req,res)=>{
//     console.log('login in admin1');
//     try {
//         res.render('admin/adminLogin', { title: 'Feather-Admin Login' });
//      console.log('login in admin');
//     } catch (error) {
//         console.log('error in loading login in admin')
//         res.render('pageNotFound',{ title:'Feather - 404'});
//     }
// };

// const verifyLoginad = async(req,res)=>{
//     console.log('verifying admin')
//     try {
//         const {email,password} = req.body;
//         console.log('Req body:', req.body); 

//         const admin = await User.findOne({isAdmin:true,email:email})
        

//          if(admin){
//          const isMatch = await bcrypt.compare(password,admin.password)

//             if(isMatch){
//                 req.session.admin = true;
//                 return res.redirect('/admin/dashboard');
//                 }else{
//                     res.render('admin/adminLogin',{ title: 'Feather-Admin login',message:'Incorrect password' })
//                 }
//             }else{
//                 console.log('not admin');
//                             res.render('admin/adminLogin',{ title: 'Feather-Admin login',message:'Login failed , Please try again' })
//                         }

//     } catch (error) {
//         console.log('error in veriying admin',error);
//        res.redirect('/pageNotFound');
//     }
// };

// const loadDashboard = async(req,res)=>{
//     if(req.session.admin){
//         try {
//         res.render('admin/dashboard');
// console.log('in dashboard')
//         } catch (error) {
//             console.log('error in dashboard loading',error);
//             res.redirect('/pageNotFound');
//         }
//     }
   
// }


// module.exports = {
//     loadLoginadmin,
//     verifyLoginad,
//     loadDashboard,

// }


const User = require('../models/userSchema');
const bcrypt = require('bcrypt');

// Load the admin login page
    const Login = async( req,res)=>{
        try{
        console.log('admin Login');
        res.render('admin/adminLogin',{title:'Admin login'})
           }catch(error){
         res.redirect('/pageNotPage');
          console.log(error)
                }
    }



// Verify admin login credentials
const admincheck = async (req, res) => {
    console.log('Verifying admin cre.');
    try {
        const { email, password } = req.body;
        console.log('Request body:', req.body);

        const admin = await User.findOne({ isAdmin: true, email: email });

        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);

            if (isMatch) {
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            } else {
                res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Incorrect password' });
            }
        } else {
            console.log('Not an admin');
            res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Login failed, please try again' });
        }
    } catch (error) {
        console.error('Error verifying admin credentials:', error);
        res.redirect('/pageNotFound');
    }
};

// // Load the admin dashboard
const dashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            res.render('admin/dashboard');
            console.log('Admin dashboard loaded');
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            res.redirect('/pageNotFound');
        }
    } else {
        console.log(error);
        res.redirect('/admin/log');
    }
};

module.exports = {
    Login,
    admincheck,
    dashboard,
};
