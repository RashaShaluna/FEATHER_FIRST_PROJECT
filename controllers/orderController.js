const Category = require('../models/category');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const {log} = require('console');


// ================================= order cofirmation page  in user side =========================const orderConfirmation = async (req, res) => {
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
        const { orderId, productId } = req.params;

        const [order, categories] = await Promise.all([
            Order.findById(orderId).populate({
                path: 'orderitems.productId',
                model: Product,
            }),
            Category.find({ islisted: true, isDeleted: false }),
        ]);

        const orderitem = order.orderitems.find(item => item._id.toString() === productId);

        res.render('users/orderCancellation', { order, orderitem, title: 'Order Cancellation - Feather', categories });
    } catch (error) {
        console.error(error);
        res.redirect('/serverError');
    }
};


// ================================= order cancellation in user side =========================
const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        log('Initial productId:', productId);
        
        const { cancelReason, cancellationComments, payment } = req.body;

        const [userData, order, categories, product] = await Promise.all([
            User.findOne({ _id: req.session.user }),
            Order.findById(orderId)
                .populate({
                    path: 'orderitems.productId',
                    model: Product,
                }),
            Category.find({ islisted: true, isDeleted: false }),
            Product.findById(productId),
        ]);

        log('Order Items:', order.orderitems);

        const productToCancel = order.orderitems.find(item => {
            log('Checking item:', item);  
            return item._id.toString() === productId;  
        });

        if (!productToCancel) {
            log('Product to cancel not found!');
            return res.redirect('/orderNotFound'); // Redirect if product not found
        }

        // Update cancellation details
        productToCancel.status = 'Cancelled';
        productToCancel.cancelReason = cancelReason;
        productToCancel.cancellationComments = cancellationComments;
        productToCancel.cancelDate = new Date();
        productToCancel.refundMode = payment;

        // Adjust the order's total amount and quantity
        const productPrice = productToCancel.productPrice;
        const cancelledQuantity = productToCancel.originalQuantity;

        order.totalAmount -= productPrice * cancelledQuantity;
        order.orderQuantity -= cancelledQuantity;

        const productUpdatePromises = [
            Product.findByIdAndUpdate(
                productId,
                {
                    $inc: { quantity: cancelledQuantity, orderCount: -cancelledQuantity }
                }
            )
        ];

        // Save order and update product details
        await Promise.all([order.save(), ...productUpdatePromises]);

        log('Order and product successfully updated.');
        res.redirect(`/orderDetail/${orderId}/${productId}`);

    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.redirect('/serverError');
    }
};


// ================================= order detail page in user side =========================

// 
const orderDetail = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params; // Assuming you're passing both orderId and orderItemId
        console.log('In detail');

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

        // Find the specific order item using the orderItemId
        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        if (!orderItem) {
            return res.status(404).send('Order item not found');
        }

        res.render("users/orderDetail", { userData, order, title: 'Order Detail - Feather', categories, orderItem });
    } catch (error) {
        console.log(error);
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
        
        const orderItem = order.orderitems.id(orderItemId); 

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
        log('saved', order);
         
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
