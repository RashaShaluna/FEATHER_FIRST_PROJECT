const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const path = require('path');
const fs = require('fs');
const {log} = require('console');
const mongoose = require('mongoose');

const addToWishlist = async (req, res) => {
    try {
        log('add ')
        const productId = req.body.productId;
        const userId = req.session.user; 

        User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } })
        .then(() => res.json({ success: true }))
        .catch(error => res.status(500).json({ success: false, message: 'Error adding to wishlist', error }));

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error adding product to wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;

        User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } })
        .then(() => res.json({ success: true }))
        .catch(error => res.status(500).json({ success: false, message: 'Error removing from wishlist', error }));
    
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error removing product from wishlist' });
    }
};


const getWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('wishlist');
        return res.render('wishlist', { wishlist: user.wishlist });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error retrieving wishlist' });
    }
};


module.exports = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
}