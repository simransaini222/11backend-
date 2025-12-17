const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, default: "My MLM Company" },

  // Financials
  totalJoiningFees: { type: Number, default: 0 }, // total collected from users
  totalProductSales: { type: Number, default: 0 }, // total products sold (tracking)
  totalCommissionPaid: { type: Number, default: 0 }, // all commission payouts
  adminProfit: { type: Number, default: 0 }, // net profit = fees + sales - commission

  // Tracking MLM cycles
  totalUsers: { type: Number, default: 0 },
  totalCyclesCompleted: { type: Number, default: 0 },

  // History log
  history: [
    {
      type: { type: String }, // "JOINING_FEE", "COMMISSION", "SALE"
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Company", companySchema);
