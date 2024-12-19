const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const env = require('dotenv').config();
const {log} = require('console');
const Razorpay = require('razorpay');


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
        const [user, products, categories, addresses, cart] = await Promise.all([
            User.findById(req.session.user),
            Product.find({ isBlocked: false, isDeleted: false }),
            Category.find({ islisted: true, isDeleted: false }),
            Address.find({ userId:req.session.user, isDeleted: false }),
            Cart.findOne({ userId: req.session.user }).populate({
                path: 'items.productId',
                model: Product
            }),
        ]);
       
        const totalPrice=cart.items.reduce((total,item)=>total+item.totalPrice,0);
        res.render('users/checkOut', { title: 'Feather - Checkout', userId:user, products, categories, addresses, cart, totalPrice});
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
        const { selectedAddress, paymentMethod } = req.body;
        log('selected address',selectedAddress)

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
      
        if (paymentMethod !== 'Cash on Delivery') {
            log('cod is availabel')
            return res.redirect('/serverError');
        }

        const totalAmount = cart.items.reduce((sum, item) => sum + (item.totalPrice || item.productId.salesPrice * item.quantity), 0);

        const discountAmount = cart.discountamount || 0; 
        const additionalCharges = 0; 
        const  orderPrice = totalAmount - discountAmount + additionalCharges;       
        const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);
        const orderQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        const orderItems = cart.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            originalQuantity: item.quantity,
            orderPrice: item.totalPrice || item.productId.salesPrice * item.quantity,
            productPrice: item.productId.salesPrice * item.quantity, 
        }));

        const newOrder = new Order({
            userId, 
            orderUserDetails: userId, 
            orderitems: orderItems,
            totalAmount,
            orderPrice,
            paymentMethod,
            status: 'Pending',
            orderDate: new Date(),
            address: selectedAddress, 
            estimatedDeliveryDate,
            orderQuantity
        });

        await Promise.all([
            newOrder.save(),
            ...orderItems.map(item => Product.findByIdAndUpdate(item.productId,{
                $inc:{quantity:-item.quantity}
            })),
            ...orderItems.map(item => Product.findByIdAndUpdate(
                item.productId,
                {$inc:{orderCount:item.quantity}}
            )),
            Cart.findOneAndDelete({ userId }),
        ]);

        res.redirect(`/orderConfirmation/${newOrder._id}`); 
    } catch (error) {
        console.error("Error placing order:", error);
        res.redirect('/serverError');
    }

}; 


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});
// razorpay payment
const createOrder = async (req, res) => {
    try {
        log('razor')
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency: 'INR',
            receipt: `receipt#${Math.floor(Math.random() * 10000)}`
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};


const verifyRazorpay = async(req,res)=>{
     try{
        log('in verifying payment')
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
    
        const isAuthentic = expectedSignature === razorpay_signature;
    
        if (isAuthentic) {
            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
     }catch(error){
        log(error)
      res.redirect('/serverError')
     }
}


module.exports ={
    checkout,
    editAddress,
    addAddress,
    placeOrder,
    createOrder,
    verifyRazorpay
}