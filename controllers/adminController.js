
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


// //sales report page

// const salesReport = async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const pageSize = 10;
//       const { startDate, endDate, filterBy = 'all' } = req.query;
      
//       let dateFilter = {
//         status: 'Delivered',
//       };
      
//       if (filterBy !== 'all') {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
        
//         const todayEnd = new Date();
//         todayEnd.setHours(23, 59, 59, 999);
        
//         switch (filterBy.toLowerCase()) {
//           case '1 day':
//             dateFilter.orderDate = {
//               $gte: today,
//               $lte: todayEnd
//             };
//             break;
//           case 'week':
//             let weekStart = new Date(today);
//             weekStart.setDate(today.getDate() - 7);
//             dateFilter.orderDate = {
//               $gte: weekStart,
//               $lte: todayEnd
//             };
//             break;
//           case 'month':
//             let monthStart = new Date(today);
//             monthStart.setDate(1);
//             dateFilter.orderDate = {
//               $gte: monthStart,
//               $lte: todayEnd
//             };
//             break;
//           case 'year':
//             let yearStart = new Date(today);
//             yearStart.setMonth(0, 1);
//             dateFilter.orderDate = {
//               $gte: yearStart,
//               $lte: todayEnd
//             };
//             break;
//         }
//       } else if (startDate || endDate) {
//         if (!dateFilter.orderDate) {
//           dateFilter.orderDate = {};
//         }
        
//         if (startDate) {
//           const startDateTime = new Date(startDate);
//           startDateTime.setHours(0, 0, 0, 0);
//           dateFilter.orderDate.$gte = startDateTime;
//         }
        
//         if (endDate) {
//           const endDateTime = new Date(endDate);
//           endDateTime.setHours(23, 59, 59, 999);
//           dateFilter.orderDate.$lte = endDateTime;
//         }
//       }
      
//       const [totalOrders, orders] = await Promise.all([
//         Order.countDocuments(dateFilter),
//         Order.find(dateFilter)
//           .skip((page - 1) * pageSize)
//           .limit(pageSize)
//           .sort({ orderDate: -1 })
//           .populate({
//             path: 'orderitems.productId',
//             model: Product,
//           })
//           .populate({
//             path: 'userId',
//             model: User,
//           }),
//       ]);
      
//       const totalPages = Math.ceil(totalOrders / pageSize);
      
//       res.render('admin/salesPage', {
//         orders,
//         totalPages,
//         currentPage: page,
//         title: 'Sales Report - Feather',
//         startDate,
//         endDate,
//         filterBy,
//       });
//     } catch (error) {
//       console.error('Error in salesReport:', error);
//       res.status(500).redirect('/serverError');
//     }
//   };





const getDateFilter = (filterBy, startDate, endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); 
  
    const dateFilter = { status: 'Delivered' };
  
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
        Order.countDocuments(dateFilter),
        Order.find(dateFilter)
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
    

  const downloadPdf = async (req, res) => {
    try {
        log(req.query);
      const { startDate, endDate, filterBy = 'all' } = req.query;
      const dateFilter = getDateFilter(filterBy, startDate, endDate);

      const orders = await Order.find(dateFilter)
        .sort({ orderDate: -1 })
        .populate({
          path: 'orderitems.productId',
          model: Product,
        })
        .populate({
          path: 'userId',
          model: User,
        });

      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

      doc.pipe(res);

      doc.fontSize(16).text('Sales Report', { align: 'center' });
      doc.moveDown();

      orders.forEach((order) => {
        doc.fontSize(12).text(`Order ID: ${order._id.toString().slice(0,4)}`);
        doc.text(`Date: ${order.orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' , year:'numeric'})}`);
        doc.text(`User: ${order.userId.name}`);
        doc.text(`Total: $${order.orderPrice} `||'NA');
        order.orderitems.forEach((item) => {
          doc.text(`Product: ${item.productId.name}`);
          doc.text(`Quantity: ${item.originalQuantity}`);
          doc.text(`Total: $${item.productPrice} `);
          doc.text(`Coupon Discount: ${order.couponDiscount||'NA'}`);
          doc.text(`Order Status: ${item.status}`);
          doc.text(`Payment Method: ${item.paymentMethod}`);
          doc.text(`Payment Status: ${item.paymentStatus}`);
          doc.moveDown();
        });
      });

      doc.end();
    } catch (error) {
      console.error('Error in downloadSalesReport:', error);
      res.status(500).send('Error generating PDF');
    }
  };
  
  const ExcelJS = require('exceljs');

  const downloadExcel = async (req, res) => {
    try {
      const { startDate, endDate, filterBy = 'all' } = req.query;
      log(req.query)
  
      const dateFilter = getDateFilter(filterBy, startDate, endDate);
      const orders = await Order.find(dateFilter)
        .sort({ orderDate: -1 })
        .populate({
          path: 'orderitems.productId',
          model: Product,
        })
        .populate({
          path: 'userId',
          model: User,
        });
  
        //creating ..
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
  
      worksheet.columns = [
        { header: 'Date', key: 'orderDate', width: 20 },
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'Total', key: 'totalAmount', width: 15 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Coupon Applied', key: 'couponApplied', width: 25 },
        { header: 'Product', key: 'product', width: 25 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Quantity', key: 'quantity', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Payment', key: 'payment', width: 20 },
        { header: 'Payment Method', key: 'paymentMethod', width: 25 },
      ];
      orders.forEach((order) => {
        
        order.orderitems.forEach((item) => {
          worksheet.addRow({
            orderDate: order.orderDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            orderId: order._id.toString(),
            orderDate: order.orderDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            userName: order.userId.name,
            totalAmount: order.orderPrice || 'NA',
            couponApplied: order.couponDiscount || 'NA',
            product: item.productId.name,
            price: item.unitPrice,
            quantity: item.originalQuantity,
            discount: item.productPrice,
            status: order.status,
            payment: order.paymentStatus,
            paymentMethod: order.paymentMethod,
          });
        });
      });
  
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="sales-report.xlsx"'
      );
  
      await workbook.xlsx.write(res);
  
      res.end();
    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send('Error generating Excel file');
    }
  };
  

module.exports = {
    Login,
    admincheck,
    dashboard,
    pageerror,
    adminLogout,
    salesReport,
    downloadPdf,
    downloadExcel
};
