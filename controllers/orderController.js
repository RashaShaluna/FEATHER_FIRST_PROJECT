const Category = require('../models/category');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const {log} = require('console');


// ================================= order cofirmation page  in user side =========================
const orderConfirmation = async (req, res) => {
    try {
        log('in order confirmation');
        const {orderId }= req.params; 
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
            return res.redirect('/serverError');
        }

            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);
           

            const categories = await Category.find({ islisted: true, isDeleted: false });
        res.render('users/orderConfirmation', { title: 'Order Confirmation - Feather', order, categories, deliveryDate });
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};
// ================================= order cancellation page in  user side =========================

const cancelPage = async (req, res) => {
    try {
        log('in cancel order page');
        const {orderId }= req.params; 
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
            return res.redirect('/serverError'); 
        }

        const categories = await Category.find({ islisted: true, isDeleted: false });
        res.render('users/orderCancellation', { title: 'Order Cancellation - Feather', order, categories });
    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};

// ================================= order cancellation in user side =========================
const cancelOrder = async (req, res) => {
    try {
        log('in cancel order');
        const {orderId }= req.params; 
        log('order',orderId);
        const { cancelReason, cancellationComments, payment } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            log('order is not there')
           res.redirect('/serverError')
        }

        for (const item of order.orderitems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: item.quantity } 
            });
        }
         await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    'orderitems.$[].cancelReason': cancelReason, 
                    'orderitems.$[].cancellationComments': cancellationComments, 
                    'orderitems.$[].refundMode': payment,
                    'orderitems.$[].cancelDate': new Date(), 
                    'orderitems.$[].status': 'Cancelled', 
                    cancelDate: new Date(),
                    status: 'Cancelled', 
                }
            },
            { new: true } 
        );
   log('cancelleed')
        res.redirect(`/orderDetail/${orderId}`);
    } catch (error) {
        log(error);
        res.redirect('/serverError');
    }
};

// ================================= order detail page in user side =========================

const orderDetail = async (req, res) => {
    try {
        log('in order DetaIls');
        const {orderId }= req.params; 
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
            return res.redirect('/serverError');
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

// ================================= ordered product page in user side =========================

const orderPage = async (req, res) => {
    try {
        log('in order page');
        
        const orders = await Order.find({ userId: req.session.user })
            .populate('address')
            .populate({
                path: 'orderitems.productId', 
                model:  Product,
            }).sort({orderDate: -1 });
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);
        const categories = await Category.find({ islisted: true, isDeleted: false });
        
        res.render('users/orderPage', { title: 'Orders - Feather', orders, categories, activeTab: 'orderPage'  ,deliveryDate });
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
};
 
                                                            //~~~admin side~~\\
// ================================= order list page=========================

const orderList = async (req, res) => {
    try {
        log('in order list page');

        let search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let filter = {};

        if (search) {
            filter = {
                $or: [
                    { 'userId.name': { $regex: search, $options: 'i' } },
                    { 'order._id': { $regex: search, $options: 'i' } }, 
                    { 'status': { $regex: search, $options: 'i' } },
                ]
            };

            const parsedDate = new Date(search);
            if (!isNaN(parsedDate.getTime())) {
                filter.$or.push({ 
                    'orderDate': {
                        $gte: new Date(parsedDate.setHours(0, 0, 0)),
                        $lt: new Date(parsedDate.setHours(23, 59, 59))
                    }
                });
            }

            const parsedPrice = parseFloat(search);
            if (!isNaN(parsedPrice)) {
                filter.$or.push({ 'totalAmount': parsedPrice });
            }

            filter.$or.push({ 'order._id': { $regex: new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') } });
        }

        const count = await Order.countDocuments(filter);
        const totalPage = Math.ceil(count / limit);

        const orders = await Order.find(filter)
            .populate('userId', 'name')
            .populate('address')
            .populate({
                path: 'orderitems.productId',
                model: Product,
            })
            .sort({ orderDate: -1 })
            .limit(limit)
            .skip(skip);

        res.render('admin/orderList', {
            title: 'Order List - Feather',
            orders,
            searchQuery: search,
            currentPage: page,
            totalPage,
        });

    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};

    


// ================================= change the status of order =========================
const changeStatus =async (req, res) => {
    const { orderId, orderItemId, status } = req.body;
   log(req.body)
    try {
      const order = await Order.findById(orderId);
   
      const orderItem = order.orderitems.id(orderItemId);
    
      order.status = status;

      await order.save();
      log('saved',order)
  
    } catch (error) {
   log(error);
   res.redirect('/serverError')
    }
  };

//=========== order item  ==============

const orderItem = async(req,res)=>{
    try{
        log('in order item')
        const orderId = req.params.orderId;
        const orderItemId = req.params.orderItemId;
        const order = await Order.findById(orderId).populate({
            path: 'userId',
            select: 'name email phone',
            model: User,
        })
        .populate('address')
        .populate({
            path: 'orderitems.productId',
            model: Product,
        })
        log(order)
        const orderItem = order.orderitems.id(orderItemId);
        log(orderItem)
        return res.render('admin/orderItem',{ title:'Order Details',
            order,
            orderItem})
    }catch(err){
        console.error('Error getting order item:',err);
        res.status(500).json({success:false,message:'Failed to get order item'});
    }
};



module.exports={
    orderConfirmation,
    cancelOrder,
    cancelPage,
    orderDetail,
    orderPage,
    orderList,
    changeStatus,
    orderItem
}
