const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    images: {
      type: Array,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["In stock", "Out of stock"],
      required: true,
      default: "In stock",
    },
    color: {
      type: String,
      required: true,
    },
    salesPrice: {
      type: Number,
      required: true,
    },
    offerPercentage: {
      type: Number,
      default: null,
      set: (value) => (value === "" ? null : value),
    },
    isOfferActive: {
      type: Boolean,
      default: true,
    },
    offerPrice: {
      type: Number,
      default: null,
      set: (value) => (value === "" ? null : value),
    },
    offerStartDate: {
      type: Date,
    },
    offerEndDate: {
      type: Date,
    },
    activeOfferSource: {
      type: String,
      enum: ["product", "category", ""],
      default: null,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    createdOn: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("product", productSchema);
module.exports = Product;
