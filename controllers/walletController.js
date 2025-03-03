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
 
const [categories,wallet] = await Promise.all([
    Category.find({ islisted: true, isDeleted: false }),
      Wallet.findOne({ userId: req.session.user }),
    ])
    

    if (!wallet) {
      const newWallet = new Wallet({
        userId: req.session.user,
        balance: 0, 
        transactions: [],
      });
      await newWallet.save();

      return res.render("users/walletPage", {
        title: "My Wallet - Feather",
        user,
        walletBalance: newWallet.balance,
        transactions: [],
        currentPage: 1,
        totalPages: 1,
      });
    }

    wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const paginatedTransactions = wallet.transactions.slice(skip, skip + limit);

    return res.render("users/walletPage", {
      title: "My Wallet - Feather",
      user,
      walletBalance: wallet.balance,
      transactions: paginatedTransactions,
      categories,
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