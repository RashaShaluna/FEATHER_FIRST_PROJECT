const User = require("../models/userSchema");
const Category = require("../models/category");
const Product = require("../models/productModel");

const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/log");
    }
    next();
  } catch (error) {
    console.log("Error in admin session auth:", error);
    res.redirect("/pageerror");
  }
};
module.exports = {
  isAdmin,
};
