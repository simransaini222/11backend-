const razorpay = require("../../config/razorpay")
const crypto = require("crypto");
const Wallet = require("./walletModel")
const User = require("../user/userModel")
const CompanyAccount = require("../company/companyModel")
require("dotenv").config()
const JOINING_FEE=Number(process.env.JOINING_FEE) || 2000


// Create Razorpay order
const createOrder = async (req, res) => {
  try { 
    const { amount, userId } = req.body;

    if (!amount || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Amount and userId required" });
    }

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `wallet_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation failed", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      userId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Find wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    // Credit wallet balance
    const paymentAmount = Number(amount);
    wallet.balance += paymentAmount;
    wallet.transactions.push({
      type: "credit",
      amount: paymentAmount,
      description: "Wallet top-up via Razorpay",
    });
    await wallet.save();

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let joiningFeeDeducted = false;
    const joiningFee = Number(process.env.JOINING_FEE) || 2000;

    // Deduct joining fee if not paid
    if (!user.joiningFeePaid && wallet.balance >= joiningFee) {
      wallet.balance -= joiningFee;
      wallet.transactions.push({
        type: "debit",
        amount: joiningFee,
        description: "Joining fee deduction",
      });
      await wallet.save();

      // Credit to company account
      let company = await CompanyAccount.findOne();
      if (!company) company = new CompanyAccount();

      company.totalJoiningFees += joiningFee;
      company.adminProfit += joiningFee;
      await company.save();

      // Update user
      user.joiningFeePaid = true;
      await user.save();

      joiningFeeDeducted = true;
    }

    res.json({
      success: true,
      message: `Wallet updated successfully${joiningFeeDeducted ? ", joining fee deducted" : ""}`,
      walletBalance: wallet.balance,
      joiningFeeDeducted,
    });

  } catch (error) {
    console.error("Payment verification failed", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = { createOrder, verifyPayment };