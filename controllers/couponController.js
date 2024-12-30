const {log} = require('console');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');

//couponpage
const couponPage = async (req,res)=>{ 
    try {
        const coupons = await Coupon.find({isDeleted: false});
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

// activecoupon
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

module.exports={
    couponPage,
    addCoupon,
    deleteCoupon,
    deactivateCoupon,
    activeCoupon 

}