const Category = require("../models/category");
const {log} = require('console');

const messages = {
  NAME_DESCRIPTION_REQUIRED: "Name and Description are required!",
  CAT_EXIST: "Category already exists",
  CAT_ADDED: "Category added successfully!",
  CAT_UPDATE: "Category updated successfully",
};
// =========================================================== Category ========================================================================================
const categoryInfo = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const categories = await Category.find({
      name: { $regex: search, $options: "i" },
      isDeleted: false,
    }).sort({ name: -1 });

    res.render("admin/category", {
      categories,
      title: "Category - Feather",
      searchQuery: search,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/pageerror");
  }
};

// ========================================================== Add Category page ==========================================================================================
const addCategoryPage = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categories = await Category.findById(categoryId);

    res.render("admin/addCategory", { title: "Add Category", categories });
  } catch (error) {
    console.log(error);
  }
};

// ======================================================= Add category ======================================================================================================
const addCategory = async (req, res) => {
  try {
    const { name, description, offerPercentage, offerStartDate, offerEndDate } =
      req.body;
      log(req.body)
    const lowerCaseName = name.toLowerCase();

    if (!name || !description) {
      return res.json({
        success: false,
        message: messages.NAME_DESCRIPTION_REQUIRED,
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${lowerCaseName}$`, "i") },
    });
    if (existingCategory) {
      return res.json({ message: messages.CAT_EXIST });
    }

    const newCategory = new Category({
      name,
      description,
      offerPercentage: offerPercentage || 0,
      offerStartDate: offerStartDate || null,
      offerEndDate: offerEndDate || null,
    });

    const result = await newCategory.save();
    log(result)

    res.json({ success: true, message: messages.CAT_ADDED });
  } catch (error) {
    console.log("error in adding", error);
    res.redirect("/serverError");
  }
};

//============================================= Category List===================================================================================================

const listCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { islisted: true } });

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    res.redirect("/pageerror");
  }
};
//============================================= Category unlist=====================================================================================================

const unListCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { islisted: false } });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    res.redirect("/pageerror");
  }
};

// ====================================== Edit Category  ========================================================================================================================
const editCategory = async (req, res) => {
  try {
    const {
      categoryId,
      editedDescription,
      editedName,
      editedOfferPercentage,
      offerStartDate,
      offerEndDate,
    } = req.body;

    const lowerCaseEditedName = editedName.toLowerCase();

    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${lowerCaseEditedName}$`, "i") },
    });

    if (existingCategory) {
      return res.json({
        success: false,
        message: messages.CAT_EXIST,
      });
    }

    await Category.updateOne(
      { _id: categoryId },
      {
        $set: {
          name: editedName,
          description: editedDescription,
          offerPercentage: editedOfferPercentage,
          offerStartDate: offerStartDate,
          offerEndDate: offerEndDate,
        },
      }
    );

    res.json({ success: true, message: messages.CAT_UPDATE });
  } catch (error) {
    console.error(error);
    res.redirect("/serverError");
  }
};

// ====================================== Check Category  ========================================================================================================================

const checkCategory = async (req, res) => {
  try {
    const { editedName, categoryId } = req.body;

    const lowerCaseEditedName = editedName.toLowerCase();

    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${lowerCaseEditedName}$`, "i") },
    });

    if (existingCategory) {
      return res.json({ available: false });
    } else {
      return res.json({ available: true });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/serverError");
  }
};

// =================================================== Soft Delete Category ========================================================================================
const softDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Validate categoryId
    if (!categoryId || categoryId === "null") {
      return res.json({ success: false, message: "Invalid category ID" });
    }

    console.log("Delete category with ID:", categoryId);

    const updateResult = await Category.updateOne(
      { _id: categoryId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    console.log("Update result:", updateResult);

    if (updateResult.modifiedCount > 0) {
      res.json({ success: true, message: "Category deleted successfully" });
    } else {
      res.json({
        success: false,
        message: "Category not found or already deleted",
      });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.redirect("/serverError");
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryPage,
  listCategory,
  unListCategory,
  editCategory,
  checkCategory,
  softDeleteCategory,
};
