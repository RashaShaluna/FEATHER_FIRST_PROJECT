const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const {log} = require('console');

const checkout = async (req, res) => {
    try {
        log('in checkout')
        const userId = await User.findById(req.session.user);
        const products = await Product.find({ isBlocked: false, isDeleted: false });
        const categories = await Category.find({ islisted: true, isDeleted: false });
        const order = await Order.find({userId : userId }).populate('items-productId').exec();
        const addresses = await Address.find({ userId ,isDeleted: false});


        res.render('users/checkOut', { title: 'Feather - Checkout', userId, products, categories, order ,addresses});
    } catch (error) {
       log(error);
       res.redirect('pageNotFound');

    }
}

module.exports ={
    checkout
}