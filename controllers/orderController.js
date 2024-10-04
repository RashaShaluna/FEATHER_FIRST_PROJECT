const Category = require('../models/category');
const Order = require('../models/orderModel');
const Product = require('../models/productModel')
const {log} = require('console');



const orderConfirmation = async (req, res) => {
    try {
        log('in order confirmation');
        const {orderId }= req.params; // Extract orderId correctly
        log('order',orderId);

        const order = await Order.findById(orderId) // Use orderId directly
            .populate('address')
            .populate({
                path: 'orderitems',
                populate: {
                    path: 'productId',
                    model: Product,
                },
            });

        log(order);
        if (!order) {
            log('order is not found');
            return res.redirect('/serverError'); // Use return to avoid executing the next line
        }

       // In your controller, pass the deliveryDate as shown before
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);
           

            const categories = await Category.find({ islisted: true, isDeleted: false });
        res.render('users/orderConfirmation', { title: 'Order Confirmation - Feather', order, categories, deliveryDate });
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};
const cancelOrder = async (req, res) => {
    try {
        log('in cancel order');
        const {orderId }= req.params; // Extract orderId correctly
        log('order',orderId);

        const order = await Order.findById(orderId) // Use orderId directly;
        if (!order) {
            log('order is not found');
            return res.redirect('/serverError'); // Use return to avoid executing the next line
        }

        order.status = 'Cancelled';
        await order.save();

        res.redirect(`/orderconfirmation/${orderId}`);
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};

module.exports={
    orderConfirmation,
    cancelOrder
}
