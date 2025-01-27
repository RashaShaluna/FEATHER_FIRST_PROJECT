const Product = require("../models/productModel");
const User = require("../models/userSchema");
const Category = require("../models/category");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const env = require("dotenv").config();
const { log } = require("console");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Coupon = require("../models/couponModel");
const Wallet = require('../models/walletSchema');

function capitalizeFirstLetter(string) {
  if (!string) return "";
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
    log("in checkout");
    const userId = req.session?.user;
    const [user, products, categories, addresses, cart, coupons] =
      await Promise.all([
        User.findById(req.session.user),
        Product.find({ isBlocked: false, isDeleted: false }).populate({
          path: "category",
          model: Category,
        }),
        Category.find({ islisted: true, isDeleted: false }),
        Address.find({ userId: req.session.user, isDeleted: false }),
        Cart.findOne({ userId: req.session.user }).populate({
          path: "items.productId",
          model: Product,
          populate: {
            path: "category",
            model: Category,
          },
        }),
        Coupon.find({
          active: true,
          isDeleted: false,
          $or: [{ usedBy: { $exists: false } }, { usedBy: { $ne: userId } }],
        }),
      ]);
    const totalPrice = cart.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    res.render("users/checkOut", {
      title: "Feather - Checkout",
      userId: user,
      products,
      categories,
      addresses,
      totalPrice,
      cart,
      coupons,
    });
  } catch (error) {
    log(error);
    res.redirect("/pageNotFound");
  }
};

// ============================== edit address ==============================
const editAddress = async (req, res) => {
  try {
    const {
      addressId,
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

    const capitalizedDistrict = capitalizeFirstLetter(district);
    const capitalizedName = capitalizeFirstLetter(name);
    const capitalizedLandmark = capitalizeFirstLetter(landmark);
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name: capitalizedName,
        phone,
        locality,
        district: capitalizedDistrict,
        address,
        state,
        pincode,
        alternatePhone,
        landmark: capitalizedLandmark,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).send({ message: "Address not found" });
    }

    res.redirect("/checkout");
  } catch (error) {
    res.redirect("/serverError");
    console.error(error);
  }
};

// =================================== add address ================
const addAddress = async (req, res) => {
  try {
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
      return res.redirect("/serverError");
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

    res.redirect("/checkout");
  } catch (error) {
    console.log("Error:", error);
    res.redirect("/serverError");
  }
};

// =================== order placing ====================

const placeOrder = async (req, res) => {
  try {
    log('in place order')
    const userId = req.session.user;
    log('1')

    const { selectedAddress, paymentMethod, products, couponCode } = req.body;
    const orderPrice = parseFloat(req.body.orderPrice);
    log('1',req.body)

    
    log('1')

    const [address, cart, coupon] = await Promise.all([
      Address.findById(selectedAddress),
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        model: Product,
      }),
      couponCode
        ? Coupon.findOne({ code: couponCode, active: true, isDeleted: false })
        : null,
    ]);

    if (!address) {
      return res.status(400).send("Invalid address selected.");
    }
    log('2')

    //wallet payment
   
    log('2')

    const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);
    log('2')

    const orderItems = products.map((product) => ({
      productId: product.productId,
      originalQuantity: parseInt(product.quantity, 10),
      productPrice: parseFloat(product.productPrice),
      paymentMethod:paymentMethod ,
      paymentStatus: paymentMethod === "wallet" ? "Paid" : "pending", 
      refundMode: paymentMethod === "wallet" ? "wallet" : "No refund",
      unitPrice: parseFloat(product.effectivePrice),
      status: "Pending",
    }));
log(orderItems)
    const newOrder = new Order({
      userId,
      orderUserDetails: userId,
      orderitems: orderItems,
      orderPrice,
      paymentStatus: "pending",
      status: "Pending",
      orderDate: new Date(),
      paymentMethod:paymentMethod ,
      paymentStatus: paymentMethod === "wallet" ? "Paid" : "pending", 
      address: selectedAddress,
      estimatedDeliveryDate,
      orderQuantity: orderItems.reduce(
        (sum, item) => sum + item.originalQuantity,
        0
      ),
      couponApplied: coupon ? coupon._id : null,
    });
    if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ userId });
log('in wallet')
      if (!wallet || wallet.balance < orderPrice) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance.",
        });
      }
      log('in wallet')

      wallet.balance -= orderPrice;

      wallet.transactions.push({
        type: "debit",
        amount: orderPrice,
        description: `Payment for order ${newOrder._id}`,
      });

      await wallet.save();
    }
log(newOrder)
    await Promise.all([
      newOrder.save(),
      ...orderItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.originalQuantity },
        })
      ),
      ...orderItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { orderCount: item.originalQuantity },
        })
      ),
      Cart.findOneAndDelete({ userId }),
      coupon
        ? Coupon.findByIdAndUpdate(coupon._id, {
            $set: { usedBy: userId },
            $inc: { maxUsageCount: 1 },
          })
        : null,
    ]);

    res.json({ orderId: newOrder._id });
  } catch (error) {
    console.log("Error placing order:", error);
    res.redirect("/serverError");
  }
};



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const createOrder = async (req, res) => {
  console.log("createOrder called");
  try {
    const userId = req.session.user;
    console.log("userId:", userId);
    const { selectedAddress, orderPrice, products, couponCode } = req.body;
    console.log("selectedAddress:", selectedAddress);
    console.log("orderPrice:", orderPrice);
    console.log("products:", products);
    console.log("couponCode:", couponCode);

    const [address, cart] = await Promise.all([
      Address.findById(selectedAddress),
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        model: Product,
      }),
    ]);
    console.log("address:", address);
    console.log("cart:", cart);

    const coupon = couponCode
    ? await Coupon.findOne({
        code: couponCode,
        active: true,
        isDeleted: false,
      })
    : null;
    console.log("coupon:", coupon);

    const estimatedDeliveryDate = calculateEstimatedDeliveryDate(7);
    console.log("estimatedDeliveryDate:", estimatedDeliveryDate);

    const orderItems = products.map((product) => ({
      productId: product.productId,
      originalQuantity: parseInt(product.quantity, 10),
      productPrice: parseFloat(product.productPrice),
      unitPrice: parseFloat(product.effectivePrice),
      status: "Pending",
      paymentMethod: "razorpay",
    }));
    console.log("orderItems:", orderItems);

    const newOrder = new Order({
      userId,
      orderUserDetails: userId,
      orderitems: orderItems,
      orderPrice,
      paymentMethod: "razorpay",
      paymentStatus: "Pending",
      status: "Pending",
      orderDate: new Date(),
      address: selectedAddress,
      estimatedDeliveryDate,
      orderQuantity: orderItems.reduce(
        (sum, item) => sum + item.originalQuantity,
        0
      ),
      couponApplied: coupon ? coupon._id : null,
    });
    console.log("newOrder:", newOrder);

    await Promise.all([
      newOrder.save(),
      ...orderItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.originalQuantity },
        })
      ),
      ...orderItems.map((item) =>
        Product.findByIdAndUpdate(
          item.productId,
          { $inc: { orderCount: item.originalQuantity } },
          { $inc: { maxUsageCount: 1 } }
        )
      ),
      Cart.findOneAndDelete({ userId }),
      coupon
        ? Coupon.findByIdAndUpdate(coupon._id, {
            $set: { usedBy: userId },
            $inc: { maxUsageCount: 1 },
          })
        : null,
    ]);
    console.log("order saved");
    const razorpayOrder = await razorpay.orders.create({
      amount: orderPrice * 100,
      currency: "INR",
      receipt: `receipt_${newOrder._id}`,
    });
    console.log("razorpay order created:", razorpayOrder);
    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      orderPrice,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send("Error creating Razorpay order.");
  }
};

// verifying the razorpay and saving the order
const verifyRazorpay = async (req, res) => {
  try {
    log("verifyRazorpay called");
    log("req.body:", req.body);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    log("orderId:", orderId);

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    log("body:", body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    log("expectedSignature:", expectedSignature);
    if (expectedSignature !== razorpay_signature) {
      log("Signatures do not match");
      const order = await Order.findById(orderId);
      order.paymentStatus = "Failed";
      order.orderitems.forEach((item) => {
        item.paymentStatus = "Failed";
      });
      await order.save();
      return res.status(400).send("Payment verification failed.");
    }
    log("Signatures match");
    const order = await Order.findById(orderId);
    order.paymentStatus = "Paid";
    order.orderitems.forEach((item) => {
      item.paymentStatus = "Paid";
    });
    await order.save();

    res.json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    log("Error verifying payment:", error);
    res.redirect("/serverError");
  }
};


// payment failed
const paymentFailed = async (req, res) => {
  try {
    log("in payment failed");
    res.render("pages/paymentFailed");
  } catch (error) {
    log(error);
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  checkout,
  editAddress,
  addAddress,
  placeOrder,
  verifyRazorpay,
  createOrder,
  paymentFailed,
};
