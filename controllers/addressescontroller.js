const User = require('../models/userSchema');
const Product = require('../models/productModel');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const {log} = require('console');
const env = require('dotenv').config();
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

//================= load address ====================

const loadAddress = async (req, res) => {
    try {
        log('in address')
        const userId = req.session.user;
        log(userId)
        const categories = await Category.find({ islisted: true, isDeleted: false });
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/serverError');
        }
        const addresses = await Address.find({ userId ,isDeleted: false});
        console.log('Addresses:', addresses);

        res.render('users/address', {
            title: 'Address - Feather',
            categories,
            user,
            activeTab: 'addresses',
            addresses,  
        });
    } catch (error) {
        console.log('error:', error);
        res.redirect('/serverError');
    }
};

//  ========== add adress ================
const addAddress = async (req, res) => {
    try {
      log('in add address')
      const userId = req.session.user;
      const categories = await Category.find({ islisted: true, isDeleted: false });
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect('/serverError');
      }
  
      res.render('users/addAddress', {
        title: 'Add Address - Feather',
        categories,
        user,
        activeTab: 'addresses' ,
      });
    } catch (error) {
      console.log('error:', error);
      res.redirect('/pageNotFound');
    }
  };

  // ================== save address =========================
  const addAddressVerify = async (req, res) => {
    try {
        log('in adrress verifying  ')
      const {
        name,
        phone,
        locality,
        district,
        address,
        state,
        pincode,
        alternatePhone,
        landmark,
      } = req.body;
      const userId = req.session.user;
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect('/serverError');
      }
      const capitalizedDistrict = capitalizeFirstLetter(district);
      const capitalizedName = capitalizeFirstLetter(name);

      const addressObj = {
        userId,
        name: capitalizedName,
        phone,
        locality,
        district: capitalizedDistrict,
        address,
        state,
        pincode,
        alternatePhone,
        landmark,
      };
      const newAddress = new Address(addressObj);
      await newAddress.save();
      log(newAddress)
      res.redirect('/address');
    } catch (error) {
      console.log('error:', error);
      res.redirect('/serverError');
    }
  };


//   ============ delete address ===============
const deleteAddress = async (req, res) => {
    try {
      log('in the delete')
        const addressId = req.params.id;
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/serverError');
        }
        await Address.findByIdAndUpdate(addressId, {isDeleted: true, deletedAt: new Date()});
        log('deleted');
        res.status(200).json({ success: true, message: 'Address soft deleted successfully' });
    } catch (error) {
        console.log('error:', error);
        res.redirect('/serverError');
    }
  };

//   ============ edit address ===============
const editAddress = async (req, res) => {
    try {
        log('in edit address')
        const addressId = req.params.id;
        log(addressId)
        log(addressId)
        const userId = req.session.user;
        const categories = await Category.find({ islisted: true, isDeleted: false });
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/serverError');
        }
        const address = await Address.findById(addressId, {isDeleted: false});
        if (!address) {
            return res.redirect('/serverError');
        }
        res.render('users/editAddress', {
            title: 'Edit Address - Feather',
            categories,
            user,
            activeTab: 'addresses',
            address,
        });
    } catch (error) {
        console.log('error:', error);
        res.redirect('/serverError');
    }
  };

//   ============ update address ===============
const editAddressVerify = async (req, res) => {
    try {
        log('in address verifying  ')
      const {
        name,
        phone,
        locality,
        district,
        address,
        state,
        pincode,
        alternatePhone,
        landmark,
      } = req.body;
      const userId = req.session.user;
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect('/serverError');
      }
      const capitalizedDistrict = capitalizeFirstLetter(district);
      const capitalizedName = capitalizeFirstLetter(name);

      const addressObj = {
        userId,
        name: capitalizedName,
        phone,
        locality,
        district: capitalizedDistrict,
        address,
        state,
        pincode,
        alternatePhone,
        landmark,
      };
      const updateAddress = await Address.findByIdAndUpdate(
        req.params.id,
        addressObj,
        { new: true }
      );
      if (!updateAddress) {
        return res.redirect('/serverError');
      }
      log(updateAddress);
      res.redirect('/checkout');
    } catch (error) {
      console.log('error:', error);
      res.redirect('/serverError');
    }
  };

module.exports = {  
    loadAddress,
    addAddress,
    addAddressVerify,
    deleteAddress,
    editAddress,
    editAddressVerify
}