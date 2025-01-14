
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const {log} = require('console');
const Order = require('../models/orderModel');
const Product = require('../models/productModel')
const PDFDocument = require('pdfkit');

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
        console.log('Admin from DB:', admin);

        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);
            console.log('Password Match:', isMatch);

            if (isMatch) {
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            } else {
                return  res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Incorrect password' });
            }
            // if (isMatch) {
            //     // Set session for admin user
            //     req.session.admin = true;
            //     return res.redirect('/admin/dashboard');
            // } else {
            //     return res.render('admin/adminLogin', {
            //         title: 'Feather-Admin Login',
            //         message: 'Incorrect password'
            //     });
            // }
        } else {
            console.log('Not an admin');
            return res.render('admin/adminLogin', { title: 'Feather-Admin Login', message: 'Login failed, please try again' });
        }
    } catch (error) {
        console.error('Error verifying admin credentials:', error);
        res.redirect('/pageerror');
    }
};

//==============================Load  dashboard============================
const dashboard = async (req, res) => 
    {
        try {
            res.render('admin/dashboard',{title:'Dashboard - Feather '});
            console.log('Admin dashboard loaded');
        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            res.redirect('/admin/pageerror');
        }
   
};
//============================page error=====================================================

const pageerror = async(req,res)=>{
    try {
     res.render('admin/pageerror');
    } catch (error) {
        res.redirect('/admin/pageerror');
    }
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




const getDateFilter = (filterBy, startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); 
  
    const dateFilter = { 'orderitems.status': 'Delivered' };
    if (filterBy && filterBy !== 'all') {
      switch (filterBy.toLowerCase()) {
        case '1 day':
          dateFilter.orderDate = {
            $gte: today,
            $lte: todayEnd,
          };
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          dateFilter.orderDate = {
            $gte: weekStart,
            $lte: todayEnd,
          };
          break;
        case 'month':
          const monthStart = new Date(today);
          monthStart.setDate(1);
          dateFilter.orderDate = {
            $gte: monthStart,
            $lte: todayEnd,
          };
          break;
        case 'year':
          const yearStart = new Date(today);
          yearStart.setMonth(0, 1);
          dateFilter.orderDate = {
            $gte: yearStart,
            $lte: todayEnd,
          };
          break;
      }
    } else if (startDate || endDate) {
      dateFilter.orderDate = {};
  
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        dateFilter.orderDate.$gte = startDateTime;
      }
  
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.orderDate.$lte = endDateTime;
      }
    }
  
    return dateFilter;
  };
  
  
  const salesReport = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 10;
      const { filterBy = 'all', startDate, endDate } = req.query;
  
      const dateFilter = getDateFilter(filterBy, startDate, endDate);
  
      const [totalOrders, orders] = await Promise.all([
        Order.countDocuments({
          ...dateFilter,
          orderitems: {
            $elemMatch: { status: 'Delivered' }, 
          },        }),
        Order.find({
          ...dateFilter,
          orderitems: {
            $elemMatch: { status: 'Delivered' }, 
          },        })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .sort({ orderDate: -1 })
          .populate({
            path: 'orderitems.productId',
            model: Product,
          })
          .populate({
            path: 'userId',
            model: User,
          }),
      ]);
      log(orders,'orders')
      log(totalOrders,'totalOrders')
      const totalPages = Math.ceil(totalOrders / pageSize);
  
      res.render('admin/salesPage', {
        orders,
        totalPages,
        currentPage: page,
        title: 'Sales Report - Feather',
        startDate,
        endDate,
        filterBy,
      });
    } catch (error) {
      console.error('Error in salesReport:', error);
      res.status(500).redirect('/serverError');
    }
  };
    

module.exports = {
    Login,
    admincheck,
    dashboard,
    pageerror,
    adminLogout,
    salesReport,
    getDateFilter
};
