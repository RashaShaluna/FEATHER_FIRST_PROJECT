const { log } = require("console");
const User = require("../models/userSchema");
const Category = require("../models/category");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Wallet = require("../models/walletSchema");

//wallet page
const walletPage = async (req, res) => {
  try {
    console.log("inside");

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const user = req.session.user;
    if (!user) {
      return res.status(404).send("User not found");
    }

    console.log("Fetching wallet...");

    // Fetch wallet including all transactions
    const wallet = await Wallet.findOne({ userId: req.session.user }).populate("transactions");

    if (!wallet) {
      const newWallet = new Wallet({
        userId: req.session.user,
        balance: 0,
        transactions: [],
      });
      await newWallet.save();
      console.log("New wallet created");

      return res.render("users/walletPage", {
        title: "My Wallet - Feather",
        user,
        walletBalance: newWallet.balance,
        transactions: [],
        currentPage: 1,
        totalPages: 1,
      });
    }

    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    const paginatedTransactions = wallet.transactions.slice(skip, skip + limit);

    console.log(`Total transactions: ${totalTransactions}, Showing page ${page}`);

    return res.render("users/walletPage", {
      title: "My Wallet - Feather",
      user,
      walletBalance: wallet.balance,
      transactions: paginatedTransactions,
      categories: await Category.find({ islisted: true, isDeleted: false }),
      activeTab: "wallet",
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/serverError");
  }
};

module.exports = {
  walletPage,
};
