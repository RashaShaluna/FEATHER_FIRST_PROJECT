const User = require('../models/userSchema');
const Product = require('../models/productModel');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const {log} = require('console');
const env = require('dotenv').config();


//================= load address ====================

const loadAddress = async (req, res) => {
    try {
      log('in address')
      const userId = req.session.user;
      const categories = await Category.find({ islisted: true, isDeleted: false });
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect('/serverError');
      }
      const addresses = await Address.find({ userId });
  
      res.render('users/address', {
        title: 'Address - Feather',
        categories,
        user,
        activeTab: 'addresses' ,
        addresses,
      });
    } catch (error) {
      console.log('error:', error);
      res.redirect('/serverError');
    }
  };

  
module.exports = {  
    loadAddress,
}