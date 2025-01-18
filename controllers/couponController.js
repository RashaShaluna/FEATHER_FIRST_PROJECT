const {log} = require('console');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');

//couponpage
const couponPage = async (req,res)=>{ 
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page-1)*limit;

      const [totalCoupons, coupons] = await Promise.all([
        Coupon.countDocuments({ isDeleted: false }),
        Coupon.find({isDeleted: false}).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ]);
      const totalPages = Math.ceil(totalCoupons / limit);

      res.render('admin/coupon', { coupons ,title:'Coupon - Feather',  currentPage: page,
        totalPages,});
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).send('Internal Server Error');
      }
}

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
     limit
    } = req.body;

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ 
      couponName: { $regex: new RegExp(`^${couponName}$`, 'i') } 
    });

    if (existingCoupon) {
      return res.status(200).json({
        success: false,
        message: 'A coupon with this name already exists'
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
      limit:limit,
    });

    await newCoupon.save();
    
    return res.status(200).json({
      success: true,
      message: 'Coupon added successfully'
    });

  } catch (error) {
    console.error('Error adding coupon:', error);
    return res.status(200).json({
      success: false,
      message: 'An error occurred while adding the coupon'
    });
  }
}


//deletecoupon
const deleteCoupon = async (req,res)=>{
    try {
      const couponId = req.params.id;

        const coupon = await Coupon.findByIdAndUpdate(couponId, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!coupon) {
          return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
    
        res.json({ success: true, message: 'Coupon successfully deleted' });
        log('done deleting coupon')
      } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).redirect('/serverError')
      }
}

// deactivecoupon
 const deactivateCoupon = async (req, res) => {
  const couponId = req.query.id;

  try {
    const coupon = await Coupon.updateOne(
      { _id: couponId },
      { $set: { active: false, isDeleted: false } }
    );
     res.redirect('/admin/coupon');
     log('done deactivating coupon')
  } catch (err) {
    console.error(err);
    res.status(500).redirect('/serverError')
  }
}

//active
const activeCoupon = async (req, res) => {
  const couponId = req.query.id;

  try {
    const coupon = await Coupon.updateOne(
      { _id: couponId },
      { $set: { active: true, isDeleted: false } }
    );

    res.redirect('/admin/coupon');
    log('done activating coupon')
  } catch (err) {
    console.error(err);
    res.status(500).redirect('/serverError')
  }
}

//Getcoupon
const getCoupon = async (req, res) => {
  try {
    const currentDate = new Date();
    const coupons = await Coupon.find({ isDeleted: false, active: true, expireDate: { $gte: currentDate },
      $or:[
      {usedBy:{$exists:false}},
      {usedBy:{$ne:req.session.user}},
    ] });
    res.json({ coupons });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).redirect('/serverError');
  }
}

//applycoupon
const applyCoupon = async(req,res)=>{
  try{
    log('1')
     const {couponCode,subtotal} = req.body;
     const userId = req.session.user;
     log(couponCode)
     const coupon = await Coupon.findOne({isDeleted:false,active:true,code:couponCode})
     log(coupon)

     if (coupon.expireDate && new Date() > coupon.expireDate) {
      return res.json({ success: false, message: 'Coupon has expired' });
    }

    const discountAmount = coupon.discountAmount || 0;
    const minPurchaseAmount = coupon.minPurchaseAmount || 0;
    log(discountAmount, 'discount amount in apply code');

    if (coupon.usedBy && coupon.usedBy.includes(userId)) {
      return res.json({ success: false, message: 'Coupon already applied' });
    }

    res.json({ success: true, message: 'Coupon applied', discountAmount, minPurchaseAmount });
  }catch(err){
    log(err)
    res.status(500).redirect('/serverError') 
  }
}

//remove coupon

const removeCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode, isDeleted: false, active: true });

    if (!coupon) {
      return res.json({ success: false, message: 'No such coupon applied' });
    }

    req.session.appliedCoupons = req.session.appliedCoupons || [];
    const couponIndex = req.session.appliedCoupons.indexOf(couponCode);

    if (couponIndex === -1) {
      return res.json({ success: false, message: 'Coupon not applied to the cart' });
    }

    req.session.appliedCoupons.splice(couponIndex, 1);


    const subtotal = req.session.subtotal || 0; 
    const discountAmount = 0;
    const orderPrice = subtotal - discountAmount;

    res.json({ success: true, message: 'Coupon removed successfully', orderPrice: orderPrice });
  } catch (err) {
    console.error('Error removing coupon:', err);
    res.status(500).redirect('/serverError');
  }
};




module.exports={
    couponPage,
    addCoupon,
    deleteCoupon,
    deactivateCoupon,
    activeCoupon,
    getCoupon,
    applyCoupon,
    removeCoupon


}