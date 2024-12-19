const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Cart = require('../models/cartModel');
const path = require('path');
const fs = require('fs');
const {log} = require('console');
const mongoose = require('mongoose');

// add to wishlist
const addToWishlist=async (req, res) => {
      try {
        log('in add')
        const { productId } = req.body;
        const userId = req.session.user;
  
        if (!userId) {
          return res.status(401).json({ success: false, message: 'User not logged in' });
        }
  
        let wishlist = await Wishlist.findOne({ userId });
  
        if (!wishlist) {
          wishlist = new Wishlist({ userId, products: [] });
        }
  
        const existingProduct = wishlist.products.find(
          (item) => item.productsId.toString() === productId
        );
  
        if (existingProduct) {
          return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        }
  
        wishlist.products.push({ productsId: productId });
        await wishlist.save();
          log('saved')
        res.json({ success: true, message: 'Product added to wishlist' });
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    };
// Remove from Wishlist
 const removeFromWishlist= async (req, res) => {
    try {
        log('inremove')
      const { productId } = req.body;
      const userId = req.session.user;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
      }

      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return res.status(404).json({ success: false, message: 'Wishlist not found' });
      }

      wishlist.products = wishlist.products.filter(
        (item) => item.productsId.toString() !== productId
      );

      await wishlist.save();
log('done')
      res.json({ success: true, message: 'Product removed from wishlist' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


  const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
        
        const [wishlist, categories, cart] = await Promise.all([
            Wishlist.findOne({ userId }).populate({ 
                path: 'products.productsId',
                model: Product
            }),
            Category.find({ islisted: true, isDeleted: false }),
            Cart.findOne({ userId }).populate({
                path: 'items.productId',
                model: Product
            })
        ]);

        res.render('users/wishlist', { 
            cart: cart || { items: [] },  // Provide empty items array if cart doesn't exist
            categories,
            wishlist,
            title: 'Wishlist - Feather'
        });
    } catch (error) {
        console.error('Error getting wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
module.exports = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
}