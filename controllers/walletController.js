const {log} = require('console');
const User = require('../models/userSchema');
const Category = require('../models/category');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Wallet = require('../models/walletSchema');

//wallet page
const walletPage = async (req, res) => {
    try {
        log('inside     ');
        const user = req.session.user;
        log(user);
        if (!user) {
            return res.status(404).send('User not found');
        }

        log('inside     ');

        const [wallet,categories] = await Promise.all([
            Wallet.findOne({ userId: req.session.user }).populate('transactions'),
            Category.find({ islisted: true, isDeleted: false }),
        ]);

        log(wallet);
        log('inside');

        if (!wallet) {
            const newWallet = new Wallet({
                userId: req.session.user,
                balance: 0,
                transactions: [],
            });
            await newWallet.save();
            log('done');
            return res.render('users/walletPage', { title:'My Wallet- Feather',user, walletBalance: newWallet.balance, transactions: newWallet.transactions });
        }

        return res.render('users/walletPage', { user, walletBalance: wallet.balance, transactions: wallet.transactions,title: 'My Wallet- Feather',
            user,categories,activeTab: 'wallet',

        });

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

module.exports={
    walletPage
}