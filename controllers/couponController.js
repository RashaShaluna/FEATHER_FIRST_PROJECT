const { log } = require("console");
const Coupon = require("../models/couponModel");
const Product = require("../models/productModel");

const Messages = {
  EXISTING_COUPON: "A coupon with this name already exists",
  COUPON_ADDED: "Coupon added successfully",
  COUPON_NOT_FOUND: "Coupon not found",
  COUPON_DELETED: "Coupon successfully deleted",
  INVALID_COUPON: "Invalid coupon code",
  DISCOUNT_GREATER: "Discount amount is greater than the Order Price",
  COUPON_REMOVED: "Coupon removed successfully",
};
//couponpage
const couponPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const [totalCoupons, coupons] = await Promise.all([
      Coupon.countDocuments({ isDeleted: false }),
      Coupon.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);
    const totalPages = Math.ceil(totalCoupons / limit);

    res.render("admin/coupon", {
      coupons,
      title: "Coupon - Feather",
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.redirect("/pageNotFound");
  }
};

// addcoupon
const addCoupon = async (req, res) => {
  try {
    const {
      couponName,
      description,
      startDate,
      endDate,
      offerPrice,
      minimumPrice,   
      limit,
    } = req.body;


    const existingCoupon = await Coupon.findOne({
      couponName: { $regex: new RegExp(`^${couponName}$`, "i") },
    });

    if (existingCoupon) {
      return res.json({
        success: false,
        message: Messages.EXISTING_COUPON,
      });
    }

    // Create new coupon
    const newCoupon = new Coupon({
      couponName: couponName,
      code: couponName.toUpperCase(),
      description,
      startDate,
      expireDate: endDate,
      discountAmount: offerPrice,
      minPurchaseAmount: minimumPrice,
      limit: limit,
    });

    await newCoupon.save();

    return res.json({
      success: true,
      message: Messages.COUPON_ADDED,
    });
  } catch (error) {
    res.redirect("/serverError");
  }
};

//deletecoupon
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!coupon) {
      return res.json({ success: false, message: Messages.COUPON_NOT_FOUND });
    }

    res.json({ success: true, message: Messages.COUPON_DELETED });
  } catch (error) {
    redirect("/serverError");
  }
};

// deactivecoupon
const deactivateCoupon = async (req, res) => {
  const couponId = req.query.id;

  try {
    const coupon = await Coupon.updateOne(
      { _id: couponId },
      { $set: { active: false, isDeleted: false } }
    );
    res.redirect("/admin/coupon");
  } catch (err) {
    console.error(err);
    res.redirect("/serverError");
  }
};

//active
const activeCoupon = async (req, res) => {
  const couponId = req.query.id;

  try {
    const coupon = await Coupon.updateOne(
      { _id: couponId },
      { $set: { active: true, isDeleted: false } }
    );
    res.redirect("/admin/coupon");
  } catch (err) {
    console.error(err);
    redirect("/serverError");
  }
};

//Getcoupon
const getCoupon = async (req, res) => {
  try {
    const currentDate = new Date();
    const coupons = await Coupon.find({
      isDeleted: false,
      active: true,
      expireDate: { $gte: currentDate },
      $or: [
        { usedBy: { $exists: false } },
        { usedBy: { $ne: req.session.user } },
      ],
    });
    res.json({ coupons });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    redirect("/serverError");
  }
};

//applycoupon
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.session.user;
    const minPayableAmount = 1000; 

    const coupon = await Coupon.findOne({
      isDeleted: false,
      active: true,
      code: couponCode,
    });


    if (!coupon) {
      return res.json({ success: false, message: Messages.INVALID_COUPON });
    }

    const minPurchaseAmount = coupon.minPurchaseAmount || 0;

    let discount = coupon.discountAmount || 0; // Example: ₹10,000
        let finalDiscount = discount;

        // Ensure the final payable amount is at least ₹1000
        if (subtotal - discount < minPayableAmount) {
            finalDiscount = subtotal - minPayableAmount; // Adjust discount to maintain ₹1000 payment
        }

    res.json({
      success: true,
      message: "Coupon applied",
      discountAmount:finalDiscount,
      minPurchaseAmount,
    });
  } catch (err) {
    log(err);
    res.redirect("/serverError");
  }
};

//remove coupon

const removeCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({
      code: couponCode,
      isDeleted: false,
      active: true,
    });

    req.session.appliedCoupons = req.session.appliedCoupons || [];
    const couponIndex = req.session.appliedCoupons.indexOf(couponCode);

    req.session.appliedCoupons.splice(couponIndex, 1);

    const subtotal = req.session.subtotal || 0;
    const discountAmount = 0;
    const orderPrice = subtotal - discountAmount;

    res.json({
      success: true,
      message: Messages.COUPON_REMOVED,
      orderPrice: orderPrice,
    });
  } catch (err) {
    console.error("Error removing coupon:", err);
    res.redirect("/serverError");
  }
};

module.exports = {
  couponPage,
  addCoupon,
  deleteCoupon,
  deactivateCoupon,
  activeCoupon,
  getCoupon,
  applyCoupon,
  removeCoupon,
};
