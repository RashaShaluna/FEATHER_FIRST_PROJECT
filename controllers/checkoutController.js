const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Address = require('../models/addressModel');
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
        log(user);
        const userId = await User.findById(req.session.user);
        log(userId)
        const products = await Product.find({ isBlocked: false, isDeleted: false });
        const categories = await Category.find({ islisted: true, isDeleted: false });
        const order = await Order.find({userId : userId }).populate('items-productId').exec();
        const addresses = await Address.find({ userId:userId , isDeleted: false});
        const cart= await Cart.findOne({ userId: user}).populate({
            path: 'items.productId',
            model: Product
          });        

        res.render('users/checkOut', { title: 'Feather - Checkout', userId, products, categories, order ,addresses,cart});
    } catch (error) {
       log(error);
       res.redirect('pageNotFound');

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
        console.error(error);
        res.status(500).send({ message: 'Server error occurred while updating address' });
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
        const userId = req.session.user;
        const { selectedAddress, paymentMethod } = req.body;

        // Validate selected address ID
        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(400).send("Invalid address selected.");
        }

        // Validate cart items
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            model: Product
          });
        if (!cart || cart.items.length === 0) {
            return res.status(400).send("Your cart is empty.");
        }

        // Validate payment method
        if (paymentMethod !== 'cod') {
            return res.status(400).send("Invalid payment method selected.");
        }

        // Calculate order total
        const totalAmount = cart.items.reduce((sum, item) => sum + (item.totalPrice || item.productId.price * item.quantity), 0);

        // Create order object
        const orderItems = cart.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.totalPrice || item.productId.price * item.quantity
        }));

        const newOrder = new Order({
            userId,
            address: selectedAddress,  // Use the selected address ID
            items: orderItems,
            totalAmount,
            paymentMethod: 'Cash on Delivery',
            status: 'Pending',
            placedAt: new Date(),
        });

        // Save the order
        await newOrder.save();

        // Clear the cart
        await Cart.findOneAndDelete({ userId });

        res.status(200).send({ message: 'Order placed successfully!', orderId: newOrder._id });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send("An error occurred while placing the order.");
    }
};

module.exports ={
    checkout,
    editAddress,
    addAddress,
    placeOrder
}