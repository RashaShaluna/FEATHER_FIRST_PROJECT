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
        const addresses = await Address.find({ userId:userId , isDeleted: false});
        
        res.render('users/checkOut', { title: 'Feather - Checkout', userId, products, categories, order ,addresses});
    } catch (error) {
       log(error);
       res.redirect('pageNotFound');

    }
}
 
const editAddress = async (req, res) => {
    try {
        log('edit address')
        console.log(req.body); // Add this line to see what data is being sent

        const { addressId, name, phone, locality, district, address, state, pincode, alternatePhone, landmark } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(addressId, {
            name,
            phone,
            locality,
            district,
            address,
            state,
            pincode,
            alternatePhone,
            landmark
        }, { new: true });

        if (!updatedAddress) {
            return res.status(404).send({ message: 'Address not found' });
        }

        res.redirect('/checkout');
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error occurred while updating address' });
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