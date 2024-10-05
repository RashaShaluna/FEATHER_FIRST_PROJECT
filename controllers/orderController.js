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
const cancelPage = async (req, res) => {
    try {
        log('in cancel order page');
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

        const categories = await Category.find({ islisted: true, isDeleted: false });
        res.render('users/orderCancellation', { title: 'Order Cancellation - Feather', order, categories });
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
        const { cancelReason, cancellationComments, payment } = req.body;

         await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    'orderitems.$[].cancelReason': cancelReason, // Update cancel reason for all items
                    'orderitems.$[].cancellationComments': cancellationComments, // Update cancellation comments
                    'orderitems.$[].refundMode': payment, // Update refund mode
                    'orderitems.$[].cancelDate': new Date(), // Update cancellation date
                    'orderitems.$[].status': 'Cancelled', // Set status of all order items to 'Cancelled'
                    cancelDate: new Date(),
                    status: 'Cancelled', // Set the overall order status to 'Cancelled'
                }
            },
            { new: true } // Return the updated order
        );
   log('cancelleed')
        res.redirect(`/orderDetail/${orderId}`);
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};


const orderDetail = async (req, res) => {
    try {
        log('in order DetaIls');
        const {orderId }= req.params; // Extract orderId correctly
        log('order',orderId);

        const order = await Order.findById(orderId)
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
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        const categories = await Category.find({ islisted: true, isDeleted: false });
        res.render('users/orderDetail', { title: 'Order Detail - Feather', order, categories ,deliveryDate });
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};


module.exports={
    orderConfirmation,
    cancelOrder,
    cancelPage,
    orderDetail
}
