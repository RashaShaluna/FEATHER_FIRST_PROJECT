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
const getCoupon = async (req,res) => {
  try {
    const coupons = await Coupon.find({ isDeleted: false, active: true });
    // log(coupons)
    res.json({coupons});
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).redirect('/serverError')}
}

//applycoupon
const applyCoupon = async(req,res)=>{
  try{
    log('1')
     const {couponCode} = req.body;
     log(couponCode)
     const coupon = await Coupon.findOne({isDeleted:false,active:true,code:couponCode})
     log(coupon)

     //checking if the code is expired
     if (coupon.expireDate && new Date() > coupon.expireDate) {
      return res.json({ success: false, message: 'Coupon has expired' });
    }

    const discountAmount = coupon.discountAmount || 0;
    const minPurchaseAmount = coupon.minPurchaseAmount || 0;
  log(discountAmount, 'discount amount in apply code');

    res.json({ success: true, message: 'Coupon applied', discountAmount, minPurchaseAmount });
  }catch(err){
    log(err)
    res.status(500).redirect('/serverError') 
  }
}
module.exports={
    couponPage,
    addCoupon,
    deleteCoupon,
    deactivateCoupon,
    activeCoupon,
    getCoupon,
    applyCoupon


}