const {log} = require('console');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');

//couponpage
const couponPage = async (req,res)=>{ 
    try {
        const coupons = await Coupon.find({isDeleted: false}).sort({ createdAt: -1 });
        res.render('admin/coupon', { coupons ,title:'Coupon - Feather'});
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).send('Internal Server Error');
      }
}

//addcoupon
const addCoupon = async (req,res)=>{
    try {
        const {
          couponName,
          code,
          description,
          startDate,
          endDate,
          offerPrice,
          minimumPrice,
        } = req.body;
    
        const newCoupon = new Coupon({
          couponName: couponName,
          code: couponName.toUpperCase().replace(/\s+/g, '') + Math.floor(10 + Math.random() * 90), 
          description,
          startDate:startDate,
          expireDate: endDate,
          discountAmount: offerPrice,
          minPurchaseAmount: minimumPrice,
          maxDiscountLimit: null,
        });
    
       const result=  await newCoupon.save();
       console.log(result)
        res.redirect('/admin/coupon');
      } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).redirect('/serverError')
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
    const coupons = await Coupon.find({ isDeleted: false, active: true, expireDate: { $gte: currentDate } });
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
     log(couponCode)
     const coupon = await Coupon.findOne({isDeleted:false,active:true,code:couponCode})
     log(coupon)

     if (coupon.expireDate && new Date() > coupon.expireDate) {
      return res.json({ success: false, message: 'Coupon has expired' });
    }

    const discountAmount = coupon.discountAmount || 0;
    const minPurchaseAmount = coupon.minPurchaseAmount || 0;
    log(discountAmount, 'discount amount in apply code');

    req.session.appliedCoupons = req.session.appliedCoupons || [];

    if (req.session.appliedCoupons.includes(couponCode)) {
      return res.json({ success: false, message: 'Coupon already applied' });
    }

    req.session.appliedCoupons.push(couponCode);
    log('Applied Coupons:', req.session.appliedCoupons);

    res.json({ success: true, message: 'Coupon applied', discountAmount, minPurchaseAmount });
  }catch(err){
    log(err)
    res.status(500).redirect('/serverError') 
  }
}

//remove coupon
// const removeCoupon = async (req, res) => {
//   try {
//     log('1');
//     const { couponCode } = req.body;
//     log('Coupon Code:', couponCode);

//     // Fetch coupon from the database to verify its existence
//     const coupon = await Coupon.findOne({ code: couponCode, isDeleted: false, active: true });
//     log('Coupon:', coupon);

//     if (!coupon) {
//       return res.json({ success: false, message: 'No such coupon applied' });
//     }

//     // Check if the coupon was applied in the session
//     req.session.appliedCoupons = req.session.appliedCoupons || [];
//     const couponIndex = req.session.appliedCoupons.indexOf(couponCode);
//     log('Coupon Index:', couponIndex);

//     if (couponIndex === -1) {
//       return res.json({ success: false, message: 'Coupon not applied to the cart' });
//     }

//     // Remove coupon from the appliedCoupons array
//     req.session.appliedCoupons.splice(couponIndex, 1);
//     log('Updated Applied Coupons:', req.session.appliedCoupons);

//     res.json({ success: true, message: 'Coupon removed successfully' });
//   } catch (err) {
//     log('Error removing coupon:', err);
//     res.status(500).redirect('/serverError');
//   }
// };
const removeCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    // Fetch coupon from the database to verify its existence
    const coupon = await Coupon.findOne({ code: couponCode, isDeleted: false, active: true });

    if (!coupon) {
      return res.json({ success: false, message: 'No such coupon applied' });
    }

    // Check if the coupon was applied in the session
    req.session.appliedCoupons = req.session.appliedCoupons || [];
    const couponIndex = req.session.appliedCoupons.indexOf(couponCode);

    if (couponIndex === -1) {
      return res.json({ success: false, message: 'Coupon not applied to the cart' });
    }

    // Remove coupon from the appliedCoupons array
    req.session.appliedCoupons.splice(couponIndex, 1);

    // Optionally, you can update the order price here if needed
    // Assume you have the subtotal and discount in your session or database
    const subtotal = req.session.subtotal || 0; // Adjust with the actual subtotal logic
    const discountAmount = 0;  // No coupon applied
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