
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');

// =======================Load admin login page=======================
    const Login = async( req,res)=>{
        try{
        console.log('admin Login');
        res.render('admin/adminLogin',{title:'Admin login'})
           }catch(error){
         res.redirect('/pageNotPage');
          console.log(error)
                }
    }



// =======================Verify admin login ================================
const admincheck = async (req, res) => {
    console.log('Verifying admin cre.');
    try {
        const { email, password } = req.body;
        console.log('Request body:', req.body);

      if (!email && !password){
       return res.render('admin/adminLogin',{ title: 'Feather-Admin Login', message: 'Password and Email required!'});
        }

        if(!email){
            return res.render('admin/adminLogin',{ title: 'Feather-Admin Login', message: ' Email required!'});

        }

        if(!password){
            return res.render('admin/adminLogin',{ title: 'Feather-Admin Login', message: 'Password required!'});

        }
        const admin = await User.findOne({ isAdmin: true, email: email });

        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);

            if (isMatch) {
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            } else {
                return  res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Incorrect password' });
            }
        } else {
            console.log('Not an admin');
            return res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Login failed, please try again' });
        }
    } catch (error) {
        console.error('Error verifying admin credentials:', error);
        return res.redirect('/pageNotFound');
    }
};

//==============================Load  dashboard============================
const dashboard = async (req, res) => 
    {
    if (req.session.admin) {
        try {
            res.render('admin/dashboard',{title:'Dashboard - Feather '});
            console.log('Admin dashboard loaded');
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            res.redirect('/pageerror');
        }
    } else {
        res.redirect('/admin/log');
        // res.redirect('/admin/log');
        console.log('Admin not authenticated, redirected to login');
    }
};
//============================page error=====================================================

const pageerror = async(req,res)=>{
     res.render('admin/pageerror');
}

// ==========================Log out==========================================================

const adminLogout = async(req,res)=>{
    try {
    console.log('in log out admin');
    req.session.destroy((err)=>{
        if(err){
            console.log('Error in logout session');
            return res.redirect('/pageerror');
        }else{
            console.log('session destroyed');
            return res.redirect('/admin/log');
        }
    })   
    

    } catch (error) {
        console.log('Error in admin logout');
        res.redirect('/pageerror');
    } 
}












module.exports = {
    Login,
    admincheck,
    dashboard,
    pageerror,
    adminLogout
};
