const Wallet = require("./accountModel")
// const User = require("../user/userModel")

// Add own payment to wallet
const addOwnPayment = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    // find user wallet
    let wallet = await Wallet.findOne({ accountNumber });
    if (!wallet) {
      // create wallet if not exists
      const user = await User.findOne({ accountNumber });
      if (!user) return res.status(400).json({ message: "User not found" });

      wallet = new Wallet({
        user: user._id,
        accountNumber,
        ownPayment: amount,
      });
    } else {
      wallet.ownPayment += amount; // add to existing
    }

    wallet.updatedAt = new Date();
    await wallet.save();

    res.status(200).json({ message: "Own payment added", wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add received payment from other user
const addReceivedPayment = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    const wallet = await Wallet.findOne({ accountNumber });
    if (!wallet) return res.status(400).json({ message: "Wallet not found" });

    wallet.receivedPayment += amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    res.status(200).json({ message: "Received payment added", wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { addOwnPayment, addReceivedPayment };
