const Category = require('../models/category');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const {log} = require('console');
const Wallet = require('../models/walletSchema');


// ================================= order cofirmation page  in user side =========================
   const orderConfirmation = async (req, res) => {
    try {
        log('on cofirm')
        const { orderId } = req.params;  
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

        
        log('hwllo')

        res.render('users/orderConfirmation', { title: 'Order Confirmation - Feather', order, categories });
    } catch (error) {
        console.log(error)
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
        log('order item product price', orderItem.productPrice);

        if (!orderItem) {
            return res.status(404).send('Order item not found');
        }

        res.render("users/orderCancellation", {
            userData,
            order,
            categories,
            orderItem,
            paymentStatus: order.paymentStatus,
            title: 'Order Detail - Feather'  ,
            orderId,
            orderItemId
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

        const [order, user] = await Promise.all([
            Order.findById(orderId),
            User.findById(req.session.user),
        ]);

        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        orderItem.status = 'Cancelled';
        orderItem.cancelReason = cancelReason;
        orderItem.cancellationComments = cancellationComments;
        orderItem.refundMode = refundMode;
        orderItem.cancelDate = new Date();

        const refundAmount = orderItem.productPrice;


const product = await Product.findById(orderItem.productId);
        product.quantity += orderItem.originalQuantity;
        console.log('Refund Mode:', refundMode);

        if (order.paymentStatus === 'Paid' && refundMode === 'wallet') {
            let wallet = await Wallet.findOne({ userId: user._id });
            orderItem.paymentStatus = 'Refunded';
            if (!wallet) {
                console.log('Wallet not found, creating a new one.');
                wallet = new Wallet({
                    userId: user._id,
                    balance: 0,
                    transactions: [],
                });
            }

            // Ensure transactions is an array
            if (!Array.isArray(wallet.transactions)) {
                console.error('Wallet transactions is not an array, initializing.');
                wallet.transactions = [];
            }

            // Add the refund transaction
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for order item ${orderId.slice(-4)}`,
            });

            // Update the wallet balance
            wallet.balance += refundAmount;

            await wallet.save();
            console.log('Wallet updated successfully');
            await Promise.all([product.save(), order.save()]);

            return res.json({
                success: true,
                message: 'Order item cancelled and wallet updated successfully.',
            });
        }else if (order.paymentStatus !== 'Paid' && refundMode === 'wallet') {
                return res.json({
                    success: false,
                    message: 'No refund is applicable for Cash on Delivery orders.',
                });
            } else if (order.paymentStatus === 'Paid' && refundMode === 'No refund') {
                return res.json({
                    success: false,
                    message: 'No refund is applicable for Paid orders.',
                });
            }else{
            await Promise.all([product.save(), order.save()]);

            return res.json({
                success: true,
                message: 'Order item cancelled successfully.',
            });
        }
      
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.redirect('/serverError');
    }
};

// ================================= order detail page in user side =========================


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

// return order page
const returnPage= async (req,res)=>{
    try {
        log('return order')
        // console.log('Query Parameters:', req.query)
        const{orderId,orderItemId} = req.params;
        
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

        res.render('users/returnPage', { 
            title: 'Return - Feather', 
           userData,
            order,
            categories,
            orderItem,
            paymentStatus: order.paymentStatus, 
            orderId,
            orderItemId
        });
    } catch (error) {
        log(error)
        res.status(404).redirect('/pageNotFound');
    }
}

//return proccess
const returnOrder = async (req,res)=>{
    try {
        log('proccesing')
        log(req.body)
        const { orderId, orderItemId,reason } = req.body; // Extract orderId and orderItemId from the POST request body

    
        const [order, user] = await Promise.all([
            Order.findById(orderId),
            User.findById(req.session.user),
        ]);

       log('1')

        const orderItem = order.orderitems.find(item => item._id.toString() === orderItemId);

        if (!orderItem) {
            console.error('Order item not found.');
            return res.status(404).send('Order item not found.');
        }

        // Update order item status to "returned"
        orderItem.status = 'Returned';
        orderItem.returnReason = reason;
        orderItem.paymentStatus = 'Refunded';
        orderItem.returnDate = new Date();
        orderItem.refundMode = 'wallet';
        const refundAmount = orderItem.productPrice;

        const [product, wallet] = await Promise.all([
            Product.findById(orderItem.productId),
            Wallet.findOne({ userId: user._id })
        ]);

        product.quantity += orderItem.originalQuantity;

        if (!wallet) {
            console.log('Wallet not found, creating a new one.');
            wallet = new Wallet({
                userId: user._id,
                balance: 0,
                transactions: [],
            });
        }
        if (!Array.isArray(wallet.transactions)) {
            console.error('Wallet transactions is not an array, initializing.');
            wallet.transactions = [];
        }

        // Add the refund transaction
        wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            description: `Refund for order item ${orderId.slice(-4)}`,
        });

        // Update the wallet balance
        wallet.balance += refundAmount;

        await wallet.save();
        console.log('Wallet updated successfully');
        await Promise.all([product.save(), order.save()]);
        log('done   ')

        return res.json({
            success: true,
            message: 'Order item returned and wallet updated successfully.',
        });        
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).send('An error occurred while processing the return request.');
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
            order.paymentStatus = 'Paid';
            orderItem.deliveryDate = new Date();
        } else if (status === 'Shipped') {
            orderItem.shippedDate = new Date();
        } else if (status === 'Processing') {
            orderItem.processingDate = new Date();
        } else if (status === 'Cancelled') {
            orderItem.cancelDate = new Date();
        } else if (status === 'Returned') {
            orderItem.returnDate = new Date();
            order.paymentStatus = 'Refunded';

        }

        await order.save(); 
        log('Order item status updated', orderItem);

        const allStatuses = order.orderitems.map(item => item.status);

        if (allStatuses.every(status => status === 'Cancelled')) {
            order.status = 'Cancelled';
            order.cancelDate = new Date(); 
        }
        else if (allStatuses.includes('Delivered')) {
            order.status = 'Delivered';
            order.paymentStatus = 'Paid';
            order.deliveredDate = new Date();
        }
        else if (allStatuses.every(status => status === 'Returned')) {
            order.status = 'Retunrned';
            order.paymentStatus = 'Refunded';
            order.returnDate = new Date();
        }
        else if (allStatuses.some(status => status === 'Shipped')) {
            order.status = 'Shipped';
            order.shippedDate = new Date(); 
        }
        else if (allStatuses.some(status => status === 'Processing')) {
            order.status = 'Processing';
            order.processingDate = new Date();
        }
        else if (allStatuses.some(status => status === 'Pending')) {
            order.status = 'Pending';
            order.pendingDate = new Date();
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
    orderItem,
    returnPage,
    returnOrder
}
