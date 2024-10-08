const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const {log} = require('console');

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ============================ checkout ===============================
const checkout = async (req, res) => {
    try {
        log('in checkout')
        const user = req.session.user
        const userId = await User.findById(req.session.user);
        const products = await Product.find({ isBlocked: false, isDeleted: false });
        const categories = await Category.find({ islisted: true, isDeleted: false });
        log('1')
       
        log('2')
        const addresses = await Address.find({ userId:userId , isDeleted: false});
        const cart= await Cart.findOne({ userId: user}).populate({
            path: 'items.productId',
            model: Product
          });
        const totalPrice=cart.items.reduce((total,item)=>total+item.totalPrice,0);
        res.render('users/checkOut', { title: 'Feather - Checkout', userId, products, categories,addresses,cart,totalPrice});
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



// Example
console.log(capitalizeFirstLetter('hello')); // "Hello"

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

        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(400).send("Invalid address selected.");
        }
      log(address)
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            model: Product
        });
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

        const orderItems = cart.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            originalQuantity: item.quantity,
            status: 'Pending',
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
            placedAt: new Date(),
            address: selectedAddress, 
        });

       await newOrder.save();
       log('newOrder',newOrder)

        for(const item of orderItems){
            await Product.findByIdAndUpdate(item.productId,{
                $inc:{quantity:-item.quantity}
            })
        }
        await Cart.findOneAndDelete({ userId });

        res.redirect(`/orderConfirmation/${newOrder._id}`); 
    } catch (error) {
        console.error("Error placing order:", error);
        res.redirect('/serverError');
    }
}; 

module.exports ={
    checkout,
    editAddress,
    addAddress,
    placeOrder
}