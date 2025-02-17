const log = console.log;
const Product = require("../models/productModel");
const Category = require("../models/category");

const setOfferPrice = async (productId) => {
  try {
    const product = await Product.findById(productId).populate("category");

    const productOfferPercentage = product.isOfferActive
      ? product.offerPercentage
      : 0;
    const categoryOfferPercentage = product.category?.isOfferActive
      ? product.category.offerPercentage
      : 0;

   
    const activeOfferSource =
      productOfferPercentage > categoryOfferPercentage ? "product" : "category";

    const largerOfferPercentage = Math.max(
      productOfferPercentage,
      categoryOfferPercentage
    );

    if (largerOfferPercentage > 0) {
      product.offerPrice = Math.floor(
        product.salesPrice * (1 - largerOfferPercentage / 100)
      );
    } else {
      product.offerPrice = null; // No active offers
    }

    product.activeOfferSource = activeOfferSource;
    const result = await product.save();
   
  } catch (error) {
    log(`Error in setOfferPrice: ${error.message}`);
  }
};

const offerActive = async (req, res) => {
  try {
    const productId = req.query.id;

    const product = await Product.findById(productId);

    if (
      !product ||
      !product.offerPercentage ||
      product.offerPercentage <= 0 ||
      !product.offerStartDate ||
      !product.offerEndDate
    ) {
      console.log(
        "Product with ID",
        productId,
        "does not have a valid offer percentage or dates"
      );
      return res.redirect(`/admin/product?error=missing-details`);
    }

    product.isOfferActive = true;
    await product.save();

    await setOfferPrice(productId);

    res.redirect("/admin/product");
  } catch (error) {
    console.log("Error in offerActive: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Deactivate product offer and reset offer price
const offerDeactive = async (req, res) => {
  try {
    const productId = req.query.id;


    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { isOfferActive: false } },
      { new: true }
    );

    if (product) {
      await setOfferPrice(productId); // Reset offer price
    }

    res.redirect("/admin/product");
  } catch (error) {
    log("Error in offerDeactive: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Activate category offer and update all related products' offer prices
const offerCategoryActive = async (req, res) => {
  try {
    const categoryId = req.query.id;


    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: { isOfferActive: true } },
      { new: true }
    );

    if (
      !category ||
      !category.offerPercentage ||
      category.offerPercentage <= 0
    ) {
      log(
        "Category with ID",
        categoryId,
        "does not have a valid offer percentage"
      );
      return res.redirect(`/admin/category?error=missing-percentage`);
    }

    if (category) {
      
      const products = await Product.find({ category: categoryId });

      // Update offer price for all products in the category
      for (const product of products) {
        await setOfferPrice(product._id);
      }
    }

    res.redirect("/admin/category");
  } catch (error) {
    log("Error in offerCategoryActive: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Deactivate category offer and reset all related products' offer prices
const offerCategoryDeactive = async (req, res) => {
  try {
    const categoryId = req.query.id;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: { isOfferActive: false } },
      { new: true }
    );

    if (category) {
      const products = await Product.find({ category: categoryId });

      // Reset offer price for all products in the category
      for (const product of products) {
        await setOfferPrice(product._id);
      }
    }
    res.redirect("/admin/category");
  } catch (error) {
    log("Error in offerCategoryDeactive: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  offerActive,
  offerDeactive,
  offerCategoryActive,
  offerCategoryDeactive,
  setOfferPrice,
};
