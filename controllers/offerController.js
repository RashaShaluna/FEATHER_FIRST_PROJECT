// const Offer = require('../models/offerModel');

// // ======================================== active offers ===================================================
// const activeOffers = async (req, res) => {
//     try {
//         const offers = await Offer.find({isActive: true});
//         res.status(200).json(offers);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// // ======================================== deactivate offers ===================================================
// const deactivateOffer = async (req, res) => {
//     try {
//         const offerId = req.params.offerId;
//         const offer = await Offer.findByIdAndUpdate(offerId, {isActive: false}, {new: true});
//         if (!offer) {
//             return res.status(404).json({ message: "Offer not found" });
//         }
//         res.status(200).json(offer);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// // ======================================== activate offers ===================================================
// const activateOffer = async (req, res) => {
//     try {
//         const offerId = req.params.offerId;
//         const offer = await Offer.findByIdAndUpdate(offerId, {isActive: true}, {new: true});
//         if (!offer) {
//             return res.status(404).json({ message: "Offer not found" });
//         }
//         res.status(200).json(offer);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

const log = console.log;
const Product  = require('../models/productModel');

const offerActive = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);

        if (!product || !product.offerPercentage || product.offerPercentage <= 0) {
            return res.redirect(`/admin/product?error=missing-percentage`);
        }

        const result = await Product.updateOne(
            { _id: productId },
            { $set: { isOfferActive: true } }
        );
log(result);

        res.redirect('/admin/product');
    } catch (error) {
        log("Error in offerActive: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



const offerDeactive = async (req, res) => {
    try {
        const productId = req.query.id;
        // await Product.findByIdAndUpdate(productId, { isOfferActive: false });
        await Product.updateOne({_id:productId},{$set:{isOfferActive:false}})
        res.redirect('/admin/product');
    }catch(error){
        log(error); 
        res.status(500).json({ message: "Internal server error" }); 
    }
}
module.exports = { offerActive, offerDeactive };
