const Category = require("../models/category");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userSchema");
const { log } = require("console");
const Wallet = require("../models/walletSchema");

const messages = {
  ORDER_WALLET: "Order item cancelled and wallet updated successfully.",
  NO_REFUND: "No refund is applicable for Cash on Delivery orders.",
  NO_REFUND_PAID: "No refund is not  applicable for Paid orders.",
  ORDER_CANCALLED: "Order item cancelled successfully.",
  ORDER_RETURNED:
    "Order item returned successfully and wallet updated succesfully",
  ORDER_NOT_FOUND: "Order not found",
  ORDER_ITEM_NOT_FOUND: "Order item not found",
  ORDER_SUCCESS: "Order status updated successfully",
};
// ================================= order cofirmation page  in user side =========================
const orderConfirmation = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [order, categories] = await Promise.all([
      Order.findById(orderId)
        .populate("address")
        .populate({
          path: "orderitems",
          populate: {
            path: "productId",
            model: Product,
          },
        }),
      Category.find({ islisted: true, isDeleted: false }),
    ]);

    res.render("users/orderConfirmation", {
      title: "Order Confirmation - Feather",
      order,
      categories,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/pageNotFound");
  }
};

// ================================= order cancellation page in  user side =========================

const cancelPage = async (req, res) => {
  try {
    const { orderId, orderItemId } = req.params;

    const [userData, order, categories] = await Promise.all([
      User.findOne({ _id: req.session.user }),
      Order.findById(orderId).populate("address").populate({
        path: "orderitems.productId",
        model: Product,
      }),
      Category.find({ islisted: true, isDeleted: false }),
    ]);

    const orderItem = order.orderitems.find(
      (item) => item._id.toString() === orderItemId
    );

    res.render("users/orderCancellation", {
      userData,
      order,
      categories,
      orderItem,
      paymentStatus: order.paymentStatus,
      title: "Order Detail - Feather",
      orderId,
      orderItemId,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.redirect("/serverError");
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

    const orderItem = order.orderitems.find(
      (item) => item._id.toString() === orderItemId
    );

    orderItem.status = "Cancelled";
    orderItem.cancelReason = cancelReason;
    orderItem.cancellationComments = cancellationComments;
    orderItem.refundMode = refundMode;
    orderItem.cancelDate = new Date();

    const refundAmount = orderItem.productPrice;

    order.orderPrice -= refundAmount;

    const product = await Product.findById(orderItem.productId);
    product.quantity += orderItem.originalQuantity;

    if (order.paymentStatus === "Paid" && refundMode === "wallet") {
      let wallet = await Wallet.findOne({ userId: user._id });
      orderItem.paymentStatus = "Refunded";
      if (!wallet) {
        wallet = new Wallet({
          userId: user._id,
          balance: 0,
          transactions: [],
        });
      }

      // Ensure transactions is an array
      if (!Array.isArray(wallet.transactions)) {
        console.error("Wallet transactions is not an array, initializing.");
        wallet.transactions = [];
      }

      // Add the refund transaction
      wallet.transactions.push({
        type: "credit",
        amount: refundAmount,
        description: `Refund for order item ${orderId.slice(-4)}`,
      });

      // Update the wallet balance
      wallet.balance += refundAmount;

      await Promise.all([wallet.save(), product.save(), order.save()]);

      return res.json({
        success: true,
        message: messages.ORDER_WALLET,
      });
    } else if (order.paymentStatus !== "Paid" && refundMode === "wallet") {
      return res.json({
        success: false,
        message: messages.NO_REFUND,
      });
    } else if (order.paymentStatus === "Paid" && refundMode === "No refund") {
      return res.json({
        success: false,
        message: messages.NO_REFUND_PAID,
      });
    } else {
      await Promise.all([product.save(), order.save()]);

      return res.json({
        success: true,
        message: messages.ORDER_CANCALLED,
      });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.redirect("/serverError");
  }
};

// ================================= order detail page in user side =========================

const orderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [userData, order, categories] = await Promise.all([
      User.findOne({ _id: req.session.user }),
      Order.findById(orderId).populate("address").populate({
        path: "orderitems.productId",
        model: Product,
      }),
      Category.find({ islisted: true, isDeleted: false }),
    ]);

    res.render("users/orderDetail", {
      userData,
      order,
      title: "Order Detail - Feather",
      categories,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.redirect("/serverError");
  }
};

// ================================= ordered product page in user side =========================
const orderPage = async (req, res) => {
  try {
    const [orders, categories] = await Promise.all([
      Order.find({ userId: req.session.user })
        .populate("address")
        .populate({
          path: "orderitems.productId",
          model: Product,
        })
        .sort({ orderDate: -1 }),
      Category.find({ islisted: true, isDeleted: false }),
    ]);

    res.render("users/orderPage", {
      title: "Orders - Feather",
      orders,
      categories,
      activeTab: "orderPage",
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

// return order page
const returnPage = async (req, res) => {
  try {
    const { orderId, orderItemId } = req.params;

    const [userData, order, categories] = await Promise.all([
      User.findOne({ _id: req.session.user }),
      Order.findById(orderId).populate("address").populate({
        path: "orderitems.productId",
        model: Product,
      }),
      Category.find({ islisted: true, isDeleted: false }),
    ]);

    const orderItem = order.orderitems.find(
      (item) => item._id.toString() === orderItemId
    );

    res.render("users/returnPage", {
      title: "Return - Feather",
      userData,
      order,
      categories,
      orderItem,
      paymentStatus: order.paymentStatus,
      orderId,
      orderItemId,
    });
  } catch (error) {
    log(error);
    res.status(404).redirect("/pageNotFound");
  }
};

//return proccess
const returnOrder = async (req, res) => {
  try {
    log(req.body);
    const { orderId, orderItemId, reason } = req.body; // Extract orderId and orderItemId from the POST request body

    const [order, user] = await Promise.all([
      Order.findById(orderId),
      User.findById(req.session.user),
    ]);

    const orderItem = order.orderitems.find(
      (item) => item._id.toString() === orderItemId
    );

    // Update order item status to "returned"
    orderItem.status = "Returned";
    orderItem.returnReason = reason;
    orderItem.paymentStatus = "Refunded";
    orderItem.returnDate = new Date();
    orderItem.refundMode = "wallet";

    const refundAmount = orderItem.productPrice;

    order.orderPrice -= refundAmount;

    const [product, wallet] = await Promise.all([
      Product.findById(orderItem.productId),
      Wallet.findOne({ userId: user._id }),
    ]);

    product.quantity += orderItem.originalQuantity;

    if (!wallet) {
      console.log("Wallet not found, creating a new one.");
      wallet = new Wallet({
        userId: user._id,
        balance: 0,
        transactions: [],
      });
    }
    if (!Array.isArray(wallet.transactions)) {
      console.error("Wallet transactions is not an array, initializing.");
      wallet.transactions = [];
    }

    // Add the refund transaction
    wallet.transactions.push({
      type: "credit",
      amount: refundAmount,
      description: `Refund for order item ${orderId.slice(-4)}`,
    });

    // Update the wallet balance
    wallet.balance += refundAmount;

    await wallet.save();
    console.log("Wallet updated successfully");
    await Promise.all([product.save(), order.save()]);
    log("done   ");

    return res.json({
      success: true,
      message: messages.ORDER_RETURNED,
    });
  } catch (error) {
    console.error("Error processing return:", error);
    res.redirect("/serverError");
  }
};
//~~~admin side~~\\
// ================================= order list page=========================

const orderList = async (req, res) => {
  try {
    let search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const searchQuery = {
      $or: [
        { "userId.name": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ],
    };

    const [count, orders] = await Promise.all([
      Order.countDocuments(searchQuery),
      Order.find(searchQuery)
        .populate("userId", "name")
        .populate("address")
        .populate({
          path: "orderitems.productId",
          model: Product,
        })
        .sort({ orderDate: -1 })
        .limit(limit)
        .skip(skip),
    ]);

    const totalPage = Math.ceil(count / limit);

    res.render("admin/orderList", {
      title: "Order List - Feather",
      orders,
      searchQuery: search,
      currentPage: page,
      totalPage,
      count,
    });
  } catch (error) {
    log(error);
    res.redirect("/pageNotFound");
  }
};

// ================================= change the status of order =========================
const changeStatus = async (req, res) => {
  const { orderId, orderItemId, status } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: messages.ORDER_NOT_FOUND });
    }

    const orderItem = order.orderitems.id(orderItemId);
    if (!orderItem) {
      return res.status(404).json({ message: messages.ORDER_ITEM_NOT_FOUND });
    }

    orderItem.status = status;

    if (status === "Delivered") {
      orderItem.paymentStatus = "Paid";
      orderItem.deliveryDate = new Date();
    } else if (status === "Shipped") {
      orderItem.shippedDate = new Date();
      orderItem.processingDate = new Date();
      if (order.paymentMethod === "razorpay") {
        orderItem.paymentStatus = "Paid";
      } else if (order.paymentMethod === "Cash on Delivery") {
        orderItem.paymentStatus = "Pending";
      }
    } else if (status === "Processing") {
      orderItem.processingDate = new Date();
      if (order.paymentMethod === "razorpay") {
        orderItem.paymentStatus = "Paid";
      } else if (order.paymentMethod === "Cash on Delivery") {
        orderItem.paymentStatus = "Pending";
      }
    } else if (status === "Cancelled") {
      orderItem.cancelDate = new Date();
    } else if (status === "Returned") {
      orderItem.returnDate = new Date();
      orderItem.paymentStatus = "Refunded";
    } else if (status === "Pending") {
      if (order.paymentMethod === "razorpay") {
        orderItem.paymentStatus = "Paid";
      } else if (order.paymentMethod === "Cash on Delivery") {
        orderItem.paymentStatus = "Pending";
      }
    }
    // await order.save();
    // log('Order item status updated', orderItem);

    // const allStatuses = order.orderitems.map(item => item.status);

    // if (allStatuses.every(status => status === 'Cancelled')) {
    //     order.status = 'Cancelled';
    //     order.cancelDate = new Date();
    // }
    // else if (allStatuses.includes('Delivered')) {
    //     order.status = 'Delivered';
    //     orderItem.paymentStatus = 'Paid';
    //     order.deliveredDate = new Date();
    // }
    // else if (allStatuses.every(status => status === 'Returned')) {
    //     order.status = 'Retunrned';
    //     orderItem.paymentStatus = 'Refunded';
    //     order.returnDate = new Date();
    // }
    // else if (allStatuses.some(status => status === 'Shipped')) {
    //     order.status = 'Shipped';
    //     order.shippedDate = new Date();
    // }
    // else if (allStatuses.some(status => status === 'Processing')) {
    //     order.status = 'Processing';
    //     order.processingDate = new Date();
    // }
    // else if (allStatuses.some(status => status === 'Pending')) {
    //     order.status = 'Pending';
    //     order.pendingDate = new Date();
    // }

    await order.save();

    res.json({ message: messages.ORDER_SUCCESS, order });
  } catch (error) {
    log(error);
    res.redirect("/serverError");
  }
};

//=========== order item  ==============

const orderItem = async (req, res) => {
  try {
    const { orderId, orderItemId } = req.params;

    const [order] = await Promise.all([
      Order.findById(orderId)
        .populate({
          path: "userId",
          select: "name email phone",
          model: User,
        })
        .populate("address")
        .populate({
          path: "orderitems.productId",
          model: Product,
        }),
    ]);

    const orderItem = order.orderitems.id(orderItemId);

    return res.render("admin/orderItem", {
      title: "Order Details",
      order,
      orderItem,
    });
  } catch (err) {
    console.error("Error getting order item:", err);
    res.redirect("/serverError");
  }
};

module.exports = {
  orderConfirmation,
  cancelOrder,
  cancelPage,
  orderDetail,
  orderPage,
  orderList,
  changeStatus,
  orderItem,
  returnPage,
  returnOrder,
};
