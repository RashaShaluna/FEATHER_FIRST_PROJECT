const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const path = require('path');
const fs = require('fs');
const {log} = require('console');
const mongoose = require('mongoose');
 const whislist = async (req, res) => {
    try {
        const userId = req.session.user;
        log(userId);

        const wishlist = await Wishlist.findOne({ userId }).populate('products');
        if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
            return res.render('users/whishlist', { wishlist: [] });
          }
          res.render('users/whishlist', { wishlist });

    }catch(error){
        log(error);
        res.redirect('/serverError');
    }
}

const addtoWishlist = async (req, res) => {
    try {
       console.log("add !!!!");

       const { productId } = req.body;
       log(productId);
       const convertedProductId = mongoose.Types.ObjectId(productId); // Correctly convert string to ObjectId
       console.log('productId:', convertedProductId);

       const userId = req.session.user._id;   

       // Use findOneAndUpdate with $addToSet to add the productId to the wishlist
       // This will create the wishlist if it doesn't exist and add the productId if it's not already there
       const result = await Wishlist.findOneAndUpdate(
         { userId },
         { $addToSet: { products: productId } },
         { new: true, upsert: true } // new:true returns the updated document, upsert:true creates the document if it doesn't exist
       );
   
       if (result) {
         console.log(userId, "next", result);
         res.json({ success: true, message: 'Product added to wishlist', productId });
       } else {
         throw new Error('Failed to add product to wishlist');
       }
    } catch (error) {
       console.error('Error adding product to wishlist:', error);
       res.status(500).json({ success: false, message: 'Internal server error' });
    }
   };
   
  
   //remove product from wishlist
   const removeFromWishlist = async (req, res) => {
    try {
      log('in remove it ')
      console.log("product deleted from wishlist");
      const userId = req.session.user;
      const productId = req.params.productId;
  
  
      const updatedWishlist = await Wishlist.findOneAndUpdate(
        { userId: userId },
        { $pull: { products: productId } },
        { new: true } // to return the updated document
      );
  
      if (!updatedWishlist) {
        return res.status(404).json({ error: 'Wishlist not found for this user.' });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to remove product from wishlist.' });
    }
  };
  

  
module.exports = {
    whislist,
    addtoWishlist,
    removeFromWishlist
}