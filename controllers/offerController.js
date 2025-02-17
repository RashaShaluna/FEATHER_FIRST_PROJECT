const log = console.log;
const Product = require("../models/productModel");
const Category = require("../models/category");

const setOfferPrice = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate({
        path: "category",
        model: Category,
      });

    log('pro', product);

    const productOfferPercentage = product.isOfferActive ? product.offerPercentage : 0;
    const categoryOfferPercentage = product.category?.isOfferActive ? product.category.offerPercentage : 0;

    const activeOfferSource =
      productOfferPercentage > categoryOfferPercentage ? "product" : "category";
    const largerOfferPercentage = Math.max(productOfferPercentage, categoryOfferPercentage);

    log('ac', activeOfferSource);
    log('lar', largerOfferPercentage);

let price =  Math.floor(product.salesPrice * (1 - largerOfferPercentage / 100));
    if (largerOfferPercentage > 0) {
      product.offerPrice = price
    } else {
      product.offerPrice = null;
    }

    product.activeOfferSource = activeOfferSource;
    const result =  await product.save();
    log('set offer report',result)
  } catch (error) {
    log(`Error in setOfferPrice: ${error.message}`);
  }
};


const offerActive = async (req, res) => {
  try {
    const productId = req.query.id;

    const product = await Product.findOne({productId,isDeleted:false});

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
    log("Activating offer for category with ID", categoryId);

    const category = await Category.findById(categoryId);

   log(category)

    if (!category.offerPercentage || category.offerPercentage <= 0 || !category.offerStartDate || !category.offerEndDate) {
      return res.redirect(`/admin/category?error=missing-percentage`);
    }

    category.isOfferActive = true;
    const result = await category.save();
    log('offer cat',result)
    log("Updating offer prices for all products in category with ID", categoryId);

    const products = await Product.find({ category: categoryId ,isDeleted:false});
log(products)
    for (const product of products) {
      log("Updating offer price for product with ID", product._id);
      await setOfferPrice(product._id);
    }

    res.redirect("/admin/category");
  } catch (error) {
    log("Error in offerCategoryActive: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const offerCategoryDeactive = async (req, res) => {
  try {
    const categoryId = req.query.id;
    log("Deactivating offer for category with ID", categoryId);

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.redirect(`/admin/category?error=category-not-found`);
    }

    category.isOfferActive = false;
    await category.save();

    log(
      "Resetting offer price for all products in category with ID",
      categoryId
    );

    const products = await Product.find({ category: categoryId ,isDeleted:false});

    for (const product of products) {
      await setOfferPrice(product._id);
    }

    log("All category products have been updated");
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
