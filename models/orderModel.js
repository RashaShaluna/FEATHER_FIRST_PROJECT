const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  orderId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  orderitems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      originalQuantity: {
        type: Number,
        required: true,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
      cancelReason: {
        type: String,
      },
      cancellationComments: {
        type: String,
      },
      returnReason: {
        type: String,
      },

      paymentStatus: {
        type: "String",
      },
      refundMode: {
        type: String,
        enum: ["wallet", "No refund"],
        default: "No refund",
      },

      status: {
        type: String,
        enum: [
          "Pending",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Returned",
          "Failed",
        ],
        default: "Pending",
      },
      paymentMethod: {
        type: String,
        enum: ["wallet", "Cash on Delivery", "razorpay"],
        required: true,
      },
      orderDate: {
        type: Date,
        default: Date.now(),
      },
      returnDate: {
        type: Date,
      },
      shippedDate: {
        type: Date,
      },
      deliveryDate: {
        type: Date,
      },
      cancelDate: {
        type: Date,
      },
      estimatedDeliveryDate: {
        type: Date,
      },
      productPrice: {
        // this is what that the product that ordered for price
        type: Number,
        default: 0,
      },
    },
  ],
  orderQuantity: {
    type: Number,
    required: true,
  },

  orderPrice: {
    // this what the order price that means price of all product in a order
    type: Number,
    default: 0,
  },

  paymentMethod: {
    type: String,
    enum: ["wallet", "Cash on Delivery", "razorpay"],
    required: true,
  },

  orderDate: {
    type: Date,
    default: Date.now(),
  },

  estimatedDeliveryDate: {
    type: Date,
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
  },
  offerApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
  },
  paymentStatus: {
    type: String,
  },
  discountamount: {
    type: Number,
    defualt: 0,
  },

  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    require: true,
  },
  status: {
    type: String,
    required: true,
    enum: [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Return Request",
      "Returned",
      "Refunded",
    ],
  },
  createdOn: {
    type: Date,
    default: Date.now, // Store the created date
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
