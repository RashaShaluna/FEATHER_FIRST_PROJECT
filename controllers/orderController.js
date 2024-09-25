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
        log('user',userId)
        const products = await Product.find({ isBlocked: false, isDeleted: false });
        const categories = await Category.find({ islisted: true, isDeleted: false });
        const order = await Order.find({userId : userId }).populate('items-productId').exec();
        const addresses = await Address.find({ userId:userId , isDeleted: false});
        log('1',addresses)
        


        res.render('users/checkOut', { title: 'Feather - Checkout', userId, products, categories, order ,addresses});
    } catch (error) {
       log(error);
       res.redirect('pageNotFound');

    }
}
 
const editAddress = async (req, res) => {
    try {
        const { id } = req.params;  // Get the address ID from URL
        const updatedData = req.body;

        // Find the address by ID and update it
        const updatedAddress = await Address.findByIdAndUpdate(id, {
            updatedData
        }, { new: true });

        // Redirect or send response
        res.redirect('/checkout'); // Or use res.json() if handling with AJAX
    } catch (error) {
        console.error('Error updating address:', error);
        res.redirect('back');
    }
};






const updateOrder = async (req, res) => {
    try {
        log('in updateOrder')
        const userId = req.session.user;
        const orderId = req.params.id;
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) {
            return res.redirect('/pageNotFound');
        }

        res.redirect('/orderDetails/' + orderId);
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');

    }
}
module.exports ={
    checkout,
    editAddress
}