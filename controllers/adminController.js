const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const { log } = require("console");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const PDFDocument = require("pdfkit");

const messages = {
  mailAndPassReq: "Email and Password are required",
  passRequired: "Password required",
  emailRequired: "Email is required",
  incorrectPass: "Incorrect Password",
  loginFailed: "Login failed, please try again",
};
// =======================Load admin login page=======================
const Login = async (req, res) => {
  try {
    res.render("admin/adminLogin", { title: "Admin login" });
  } catch (error) {
    res.redirect("/pageNotPage");
    console.log(error);
  }
};

// =======================Verify admin login ================================
const admincheck = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res.render("admin/adminLogin", {
        title: "Feather-Admin Login",
        message: messages.mailAndPassReq,
      });
    }

    if (!email) {
      return res.render("admin/adminLogin", {
        title: "Feather-Admin Login",
        message: messages.emailRequired,
      });
    }

    if (!password) {
      return res.render("admin/adminLogin", {
        title: "Feather-Admin Login",
        message: messages.passRequired,
      });
    }
    const admin = await User.findOne({ isAdmin: true, email: email });

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);

      if (isMatch) {
        req.session.admin = true;
        return res.redirect("/admin/dashboard");
      } else {
        return res.render("admin/adminLogin", {
          title: "Feather-Admin Login",
          message: messages.incorrectPass,
        });
      }
    } else {
      return res.render("admin/adminLogin", {
        title: "Feather-Admin Login",
        message: messages.loginFailed,
      });
    }
  } catch (error) {
    console.error("Error verifying admin credentials:", error);
    res.redirect("/pageerror");
  }
};

//==============================Load  dashboard============================
const dashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const month = req.query.month
      ? parseInt(req.query.month)
      : currentDate.getMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year)
      : currentDate.getFullYear();
    const chartType = req.query.chartType || "monthly";

    let startDate, endDate;

    if (chartType === "monthly") {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year + 1, 0, 0);
    }

    const topProducts = await Order.aggregate([
      { $unwind: "$orderitems" },
      {
        $lookup: {
          from: "products",
          localField: "orderitems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: { createdOn: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$orderitems.productId",
          productName: { $first: "$productDetails.name" },
          totalSoldItems: { $sum: "$orderitems.originalQuantity" },
        },
      },
      { $sort: { totalSoldItems: -1 } },
      { $limit: 10 },
    ]);

    console.log("topProducts:", topProducts);

    const topCategories = await Order.aggregate([
      { $unwind: "$orderitems" },
      {
        $lookup: {
          from: "products",
          localField: "orderitems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      { $match: { createdOn: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$categoryDetails._id",
          name: { $first: "$categoryDetails.name" },
          totalSoldItems: { $sum: "$orderitems.originalQuantity" },
        },
      },
      { $sort: { totalSoldItems: -1 } },
      { $limit: 10 },
    ]);

    const statusData = await Order.aggregate([
      { $unwind: "$orderitems" },
      { $match: { createdOn: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$orderitems.status",
          count: { $sum: "$orderitems.originalQuantity" },
        },
      },
    ]);

    const orderStatus = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
      Returned: 0,
    };

    statusData.forEach((item) => {
      if (orderStatus.hasOwnProperty(item._id)) {
        orderStatus[item._id] = item.count;
      } else {
      }
    });

    res.render("admin/dashboard", {
      title: "Dashboard - Feather",
      topProducts,
      topCategories,
      orderStatus,
      month,
      year,
      chartType,
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    res.redirect("/admin/pageerror");
  }
};

//============================page error=====================================================

const pageerror = async (req, res) => {
  try {
    res.render("admin/pageerror");
  } catch (error) {
    res.redirect("/admin/pageerror");
  }
};

// ==========================Log out==========================================================

const adminLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/pageerror");
      } else {
        return res.redirect("/admin/log");
      }
    });
  } catch (error) {
    console.log("Error in admin logout");
    res.redirect("/pageerror");
  }
};

//filter
const getDateFilter = (filterBy, startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dateFilter = { "orderitems.status": "Delivered" };
  if (filterBy && filterBy !== "all") {
    switch (filterBy.toLowerCase()) {
      case "1 day":
        dateFilter.orderDate = {
          $gte: today,
          $lte: todayEnd,
        };
        break;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        dateFilter.orderDate = {
          $gte: weekStart,
          $lte: todayEnd,
        };
        break;
      case "month":
        const monthStart = new Date(today);
        monthStart.setDate(1);
        dateFilter.orderDate = {
          $gte: monthStart,
          $lte: todayEnd,
        };
        break;
      case "year":
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

//salesreport
const salesReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const { filterBy = "all", startDate, endDate } = req.query;

    const dateFilter = getDateFilter(filterBy, startDate, endDate);

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments({
        ...dateFilter,
        orderitems: {
          $elemMatch: { status: "Delivered" },
        },
      }),
      Order.find({
        ...dateFilter,
        orderitems: {
          $elemMatch: { status: "Delivered" },
        },
      })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ orderDate: -1 })
        .populate({
          path: "orderitems.productId",
          model: Product,
        })
        .populate({
          path: "userId",
          model: User,
        }),
    ]);

    const totalPages = Math.ceil(totalOrders / pageSize);

    res.render("admin/salesPage", {
      orders,
      totalPages,
      currentPage: page,
      title: "Sales Report - Feather",
      startDate,
      endDate,
      filterBy,
    });
  } catch (error) {
    console.error("Error in salesReport:", error);
    res.status(500).redirect("/serverError");
  }
};

module.exports = {
  Login,
  admincheck,
  dashboard,
  pageerror,
  adminLogout,
  salesReport,
  getDateFilter,
};
