const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountNumber: { type: String, required: true, unique: true }, // link with user account
  ownPayment: { type: Number, default: 0 },       // user ne khud add kiya
  receivedPayment: { type: Number, default: 0 },  // dusre users se mila
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Wallet", walletSchema);
