const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const env = require('dotenv').config();
const {log} = require('console');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Coupon = require('../models/couponModel');



function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
const calculateEstimatedDeliveryDate = (daysToAdd) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
};


// ============================ checkout ===============================
const checkout = async (req, res) => {
    try {
        log('in checkout')
        const userId = req.session?.user;
log(userId)
        const [user, products, categories, addresses, cart,coupons] = await Promise.all([
            User.findById(req.session.user),
            Product.find({ isBlocked: false, isDeleted: false }).populate({
                path: 'category',
                model: Category,
            }),
            Category.find({ islisted: true, isDeleted: false }),
            Address.find({ userId:req.session.user, isDeleted: false }),
            Cart.findOne({ userId: req.session.user }).populate({
                path: 'items.productId',
                model: Product,
                populate: {
                    path: 'category',  
                    model: Category
                }
            }),
            Coupon.find({active:true,isDeleted: false,
                $or: [
                {usedBy:{$exists:false}},
                {usedBy:{$ne:userId}},
            ],
        })
      ]);
      log('coupons',coupons)
        const totalPrice=cart.items.reduce((total,item)=>total+item.totalPrice,0);
        res.render('users/checkOut', { title: 'Feather - Checkout', userId:user, products, categories, addresses,totalPrice, cart,  coupons });
    } catch (error) {
       log(error);
       res.redirect('/pageNotFound');

    }

}
 
// ============================== edit address ==============================
const editAddress = async (req, res) => {
    try {
        log('edit address')
        console.log(req.body); // Add this line to see what data is being sent

        const { addressId, name, phone, locality, district, address, state, pincode, alternatePhone, landmark } = req.body;

        const capitalizedDistrict = capitalizeFirstLetter(district);
        const capitalizedName = capitalizeFirstLetter(name);
        const capitalizedLandmark = capitalizeFirstLetter(landmark);
        const updatedAddress = await Address.findByIdAndUpdate(addressId, {
            name: capitalizedName,
            phone,
            locality,
            district: capitalizedDistrict,
            address,
            state,
            pincode,
            alternatePhone,
            landmark: capitalizedLandmark,
        }, { new: true });

        if (!updatedAddress) {
            return res.status(404).send({ message: 'Address not found' });
        }

        res.redirect('/checkout');
    } catch (error) {
        res.redirect('/serverError');
        console.error(error);
    }
};





// =================================== add address ================
    const addAddress= async (req, res) => {
        try {
            log('In address verifying');
            
            const {
                name,
                phone,
                locality,
                district,
                address,
                state,
                pincode,
                alternatePhone,
                landmark,
            } = req.body;
            
            const userId = req.session.user;
            const user = await User.findById(userId);
            
            if (!user) {
                return res.redirect('/serverError');
            }


            const capitalizedDistrict = capitalizeFirstLetter(district);
            const capitalizedName = capitalizeFirstLetter(name);
            const capitalizedLandmark = capitalizeFirstLetter(landmark);

            const addressObj = {
                userId,
                name: capitalizedName,
                phone,
                locality,
                district: capitalizedDistrict,
                address,
                state,
                pincode,
                alternatePhone,
                landmark: capitalizedLandmark,
            };

            const newAddress = new Address(addressObj);
            await newAddress.save();
            log(newAddress);
            
            res.redirect('/checkout'); 
        } catch (error) {
            console.log('Error:', error);
            res.redirect('/serverError');
        }
    };


// =================== order placing ====================

const placeOrder = async (req, res) => {
    try {
        log('placing order')
        const userId = req.session.user;
        log('Request Body:', req.body);

        const { selectedAddress, paymentMethod,products,couponCode} = req.body;
        log(products)
        const orderPrice = parseFloat(req.body.orderPrice);
        log(orderPrice)
        const [address, cart,coupon] = await Promise.all([ 
            Address.findById(selectedAddress),  
            Cart.findOne({ userId }).populate({
                path: 'items.productId',
                model: Product
            }),
            couponCode ? Coupon.findOne({ code: couponCode, active: true, isDeleted: false }) : null
        ]);
        log('coupon',coupon)

        if (!address) {
            return res.status(400).send("Invalid address selected.");
        }

      
        if (paymentMethod !== 'Cash on Delivery') {
            log('cod is available')
            return res.redirect('/serverError');
        }

               
        const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);

        const orderItems = products.map(product=> ({
            productId: product.productId,
            originalQuantity: parseInt(product.quantity, 10),
            productPrice: parseFloat(product.productPrice),
            paymentMethod: 'Cash on Delivery',
            paymentStatus: 'pending',
            refundMode: 'No refund',
            unitPrice: parseFloat(product.effectivePrice),
            status: 'Pending',
        }));

        console.log('Order Items:', orderItems);

        const newOrder = new Order({
            userId, 
            orderUserDetails: userId, 
            orderitems: orderItems,
            orderPrice,
            paymentStatus:'pending',
            status: 'Pending',
            orderDate: new Date(),
            paymentMethod:'Cash on Delivery',
            address: selectedAddress, 
            estimatedDeliveryDate,
            orderQuantity: orderItems.reduce((sum, item) => sum + item.originalQuantity, 0),
            couponApplied: coupon ? coupon._id : null
        });
        log(newOrder)

        await Promise.all([
            newOrder.save(),
            ...orderItems.map(item => Product.findByIdAndUpdate(item.productId,{
                $inc:{quantity:-item.originalQuantity}
            })),
            ...orderItems.map(item => Product.findByIdAndUpdate(
                item.productId,
                {$inc:{orderCount:item.originalQuantity}},
            )),
            Cart.findOneAndDelete({ userId }),
            coupon
            ? Coupon.findByIdAndUpdate(
                coupon._id,
                {
                  $set: { usedBy: userId },
                  $inc: { maxUsageCount: 1 }
                }
              )
            : null,
        
        ]);


        log(coupon)
            console.log('checkoutcontroller completteed')
         console.log('Order placed successfully');
         res.json({ orderId: newOrder._id });
    } catch (error) {
        console.log("Error placing order:", error);
    res.redirect('/serverError');
    }
}


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY ,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});





//order placing using razorpay
const createOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { selectedAddress,orderPrice } = req.body;

        console.log("User ID:", userId);
        console.log("req,body",req.body);

        if (!userId) {
            return res.status(400).send("User ID is missing.");
        }

        const [address, cart] = await Promise.all([
            Address.findById(selectedAddress),
            Cart.findOne({ userId }).populate({
                path: 'items.productId',
                model: Product
            }),

        ]);

       
        if (!address) {
            return res.status(400).send("Invalid address selected.");
        }

        if (!cart || cart.items.length === 0) {
            log('cart is empty')
            return res.redirect('/serverError');
        }

      
        const razorpayOrder = await razorpay.orders.create({
            amount: orderPrice * 100, 
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        });
log('done')
        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            orderPrice,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send("Error creating Razorpay order.");
    }
};

// verifying the razorpay and saving the order
const verifyRazorpay = async (req, res) => {
    try {
        log('love you')
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, selectedAddress,orderPrice,products,couponCode } = req.body;

        const userId = req.session.user;
        log("User ID in session:", userId);

     
      log('couponcoe',couponCode)
        if (!userId || !selectedAddress) {
            return res.status(400).send("Required data is missing.");
        }
        const coupon = couponCode ? await Coupon.findOne({ code: couponCode, active: true, isDeleted: false }) : null;
        if (!coupon && couponCode) {
            console.log(`Invalid coupon code: ${couponCode}`);
        }   
      const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).send("Payment verification failed.");
        }

        // const cart = await Cart.findOne({ userId }).populate({
        //     path: 'items.productId',
        //     model: Product,
        // });

        // if (!cart || cart.items.length === 0) {
        //     return res.status(400).send("Cart is empty.");
        // }
// const totalAmount = cart.items.reduce((sum, item) => sum + (item.totalPrice || (item.productId.isOfferActive ===true ? item.productId.offerPrice : item.productId.salesPrice) * item.quantity), 0);


        // const discountAmount = cart.discountamount || 0;
        // const additionalCharges = 0;
        // const orderPrice = totalAmount - discountAmount + additionalCharges;
     // const orderQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
     const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);

        const orderItems = products.map((product) => ({
            productId: product.productId,
            originalQuantity: parseInt(product.quantity, 10),
            productPrice: parseFloat(product.productPrice),
             paymentMethod: 'razorpay',
             paymentStatus: 'Paid',
             refundMode: 'wallet',
             unitPrice:parseFloat(product.effectivePrice),
             status: 'Pending',

        }));

        const newOrder = new Order({
            userId,
            orderUserDetails: userId,
            orderitems: orderItems,
            orderPrice,
            paymentMethod: 'razorpay',
            status: 'Pending',
            orderDate: new Date(),
            address: selectedAddress,
            estimatedDeliveryDate,
            orderQuantity: orderItems.reduce((sum, item) => sum + item.originalQuantity, 0),
            couponApplied: coupon ? coupon._id : null

        });
     log(newOrder)
        await Promise.all([
            newOrder.save(),
            ...orderItems.map(item => Product.findByIdAndUpdate(item.productId,{
                $inc:{quantity:-item.originalQuantity}
            })),
            ...orderItems.map(item => Product.findByIdAndUpdate(
                item.productId,
                {$inc:{orderCount:item.originalQuantity}},
                {$inc: { maxUsageCount: 1 }}
            )),
            Cart.findOneAndDelete({ userId }),
            coupon
            ? Coupon.findByIdAndUpdate(
                coupon._id,
                {
                  $set: { usedBy: userId },
                  $inc: { maxUsageCount: 1 }
                }
              )
            : null,
        ]);

        res.json({ success: true, message: "Order placed successfully", orderId: newOrder._id });
    } catch (error) {
       log("Error verifying payment:", error);
        res.redirect('/serverError')
    }
};

const paymentFailed =async(req,res)=>{
    try{
        log('in payment failed')
        res.render('pages/paymentFailurepage',{title:'helo'});
    }catch(error){
        log(error)
        res.redirect('/pageNotFound');
    }
}

module.exports ={
    checkout,
    editAddress,
    addAddress,
    placeOrder,
    verifyRazorpay,
    createOrder,
    // paymentFailed
}