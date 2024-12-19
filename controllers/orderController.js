const Category = require('../models/category');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const {log} = require('console');


// ================================= order cofirmation page  in user side =========================
   const orderConfirmation = async (req, res) => {
    try {
        const { orderId } = req.params;  // productId isn't needed here, since you're dealing with all items in the order
        log('order', orderId);

        const [order, categories] = await Promise.all([
            Order.findById(orderId)
                .populate('address')
                .populate({
                    path: 'orderitems',
                    populate: {
                        path: 'productId',
                        model: Product,
                    },
                }),
            Category.find({ islisted: true, isDeleted: false }),
        ]);

        if (!order) {
            log('order not found');
            return res.redirect('/serverError');
        }

        res.render('users/orderConfirmation', { title: 'Order Confirmation - Feather', order, categories });
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
};

// ================================= order cancellation page in  user side =========================


const cancelPage = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;

        const [userData, order, categories] = await Promise.all([
            User.findOne({ _id: req.session.user }), 
            Order.findById(orderId)
                .populate('address')  
                .populate({
                    path: 'orderitems.productId',  
                    model: Product
                }),
            Category.find({ islisted: true, isDeleted: false })  
        ]);

        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        if (!orderItem) {
            return res.status(404).send('Order item not found');
        }

        res.render("users/orderCancellation", {
            userData,
            order,
            categories,
            orderItem,
            title: 'Order Detail - Feather'  
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.redirect('/serverError');  
    }
};

// ================================= order cancellation in user side =========================
const cancelOrder = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;
        const { cancelReason, cancellationComments, refundMode } = req.body;

        const order = await Order.findById(orderId);
        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        if (!orderItem) {
            return res.status(404).send('Order item not found.');
        }

        if (orderItem.status === 'Cancelled') {
            return res.status(400).send('Order item is already cancelled.');
        }

        orderItem.status = 'Cancelled';
        orderItem.cancelReason = cancelReason;
        orderItem.cancellationComments = cancellationComments;
        orderItem.refundMode = refundMode;
        orderItem.cancelDate = new Date();

        order. orderPrice-= orderItem.productPrice * orderItem.originalQuantity;

        const product = await Product.findById(orderItem.productId);
        product.quantity += orderItem.originalQuantity;
        log(product.quantity)
        await product.save();

        await order.save();

        res.redirect(`/orderDetail/${order._id}/${orderItemId}`);
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.redirect('/serverError');
    }
};

// ================================= order detail page in user side =========================

// 
const orderDetail = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;
        console.log('Order Detail Request:', orderId, orderItemId);

        const [userData, order, categories] = await Promise.all([
            User.findOne({ _id: req.session.user }),
            Order.findById(orderId)
                .populate('address')
                .populate({
                    path: 'orderitems.productId',
                    model: Product,
                }),
            Category.find({ islisted: true, isDeleted: false }),
        ]);

        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        if (!orderItem) {
            console.error('Order item not found');
            return res.status(404).send('Order item not found');
        }

        res.render("users/orderDetail", {
            userData,
            order,
            title: 'Order Detail - Feather',
            categories,
            orderItem
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.redirect('/serverError');
    }
};


// ================================= ordered product page in user side =========================
const orderPage = async (req, res) => {
    try {
        log('in order page');

        const [orders, categories] = await Promise.all([
            Order.find({ userId: req.session.user })
                .populate('address')
                .populate({
                    path: 'orderitems.productId', 
                    model:  Product,
                }).sort({orderDate: -1 }),
            Category.find({ islisted: true, isDeleted: false }),
        ]);
        
        res.render('users/orderPage', { title: 'Orders - Feather', orders, categories, activeTab: 'orderPage'  });
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

        const searchQuery = {
            $or: [
                { 'userId.name': { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
            ]
        };

        const [count, orders] = await Promise.all([
            Order.countDocuments(searchQuery),
            Order.find(searchQuery)
                .populate('userId', 'name')
                .populate('address')
                .populate({
                    path: 'orderitems.productId',
                    model: Product,
                })
                .sort({ orderDate: -1 })
                .limit(limit)
                .skip(skip),
        ]);

        const totalPage = Math.ceil(count / limit);

        res.render('admin/orderList', {
            title: 'Order List - Feather',
            orders,
            searchQuery: search,
            currentPage: page,
            totalPage,
            count
        });

    } catch (error) {
        log(error);
        res.redirect('/pageNotFound');
    }
};

// ================================= change the status of order =========================
const changeStatus = async (req, res) => {
    log('in change');
    const { orderId, orderItemId, status } = req.body;
    log(req.body);
    
    try {
        const order = await Order.findById(orderId); 
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderItem = order.orderitems.id(orderItemId); 
        if (!orderItem) {
            return res.status(404).json({ message: 'Order item not found' });
        }

        orderItem.status = status;

        if (status === 'Delivered') {
            orderItem.deliveryDate = new Date();
        } else if (status === 'Shipped') {
            orderItem.shippedDate = new Date();
        } else if (status === 'Processing') {
            orderItem.processingDate = new Date();
        } else if (status === 'Cancelled') {
            orderItem.cancelDate = new Date();
        } else if (status === 'Returned') {
            orderItem.returnDate = new Date();
        }

        await order.save(); 
        log('Order item status updated', orderItem);

        const allStatuses = order.orderitems.map(item => item.status);

        if (allStatuses.every(status => status === 'Cancelled')) {
            order.status = 'Cancelled';
        }
        else if (allStatuses.includes('Delivered')) {
            order.status = 'Delivered';
        }
        else if (allStatuses.every(status => status === 'Returned')) {
            order.status = 'Retunrned';
        }
        else if (allStatuses.some(status => status === 'Shipped')) {
            order.status = 'Shipped';
        }
        else if (allStatuses.some(status => status === 'Processing')) {
            order.status = 'Processing';
        }
        else if (allStatuses.some(status => status === 'Pending')) {
            order.status = 'Pending';
        }

        await order.save(); 
        log('Order status updated', order);
        
        res.json({ message: 'Order status updated successfully', order });
         
    } catch (error) {
        log(error);
        res.redirect('/serverError');
    }
};





//=========== order item  ==============

const orderItem = async(req,res)=>{
    try{
        log('in order item')
        const orderId = req.params.orderId;
        const orderItemId = req.params.orderItemId;
        const [order] = await Promise.all([
            Order.findById(orderId).populate({
                path: 'userId',
                select: 'name email phone',
                model: User,
            })
            .populate('address')
            .populate({
                path: 'orderitems.productId',
                model: Product,
            }),
        ]);
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
