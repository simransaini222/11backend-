const User = require("./userModel");
const Commission = require("../commision/commisonModel");
const bcrypt = require("bcryptjs");
const { createEncryptedPin } = require("../../utility/generatepin");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const companyController = require("../company/companyController");
require("dotenv").config();

const JOINING_FEE = Number(process.env.JOINING_FEE) || 2000;

/* --------------------- HELPER FUNCTIONS ----------------------- */

async function propagateCommission(userId, amount) {
  const parent = await User.findById(userId);
  if (!parent) return;

  const commission = amount * 1; // 10% upline commission
  parent.walletBalance += commission;
  parent.commissionEarned += commission;
  await parent.save();
  await companyController.addCommissionPaid(parent.name, commission);

  if (parent.parent) {
    await propagateCommission(parent.parent, commission);
  }
}

async function checkCycleCompletion(userId) {
  const user = await User.findById(userId).populate("leftChild").populate("rightChild");
  if (!user) return;

  const left = user.leftChild ? await User.findById(user.leftChild) : null;
  const right = user.rightChild ? await User.findById(user.rightChild) : null;

  if (!left || !right) return;

  let leftCount = 1;
  let rightCount = 1;

  if (left.leftChild) leftCount++;
  if (left.rightChild) leftCount++;
  if (right.leftChild) rightCount++;
  if (right.rightChild) rightCount++;

  const isCycleComplete = (leftCount >= 2 && rightCount >= 1) || (rightCount >= 2 && leftCount >= 1);

  if (isCycleComplete && !user.cycleCompletedFlag) {
    const commission = 600;

    user.walletBalance += commission;
    user.commissionEarned += commission;
    user.cyclesCompleted += 1;
    user.cycleCompletedFlag = true;
    await user.save();
    await companyController.addCommissionPaid(user.name, commission);

    if (user.parent) {
      await propagateCommission(user.parent, commission);
    }
  }
}

async function generateAccountNumber() {
  const prefix = "75920201000000";
  const lastUser = await User.findOne().sort({ accountNumber: -1 });
  if (!lastUser || !lastUser.accountNumber)
    return (BigInt(prefix) + 1n).toString();
  return (BigInt(lastUser.accountNumber) + 1n).toString();
}

async function generateSponsorId() {
  const lastUser = await User.findOne({ sponsorId: { $exists: true } })
    .sort({ sponsorId: -1 })
    .lean();
  if (!lastUser || !lastUser.sponsorId) return "CR0001";
  const lastNumber = parseInt(lastUser.sponsorId.replace("CR", ""), 10);
  return "CR" + (lastNumber + 1).toString().padStart(4, "0");
}

async function handlePayment(payerId, amount) {
  const user = await User.findById(payerId);
  if (!user) throw new Error("User not found");
  if (user.walletBalance < amount) throw new Error("Insufficient balance");

  user.walletBalance -= amount;
  await user.save();

  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("Admin not found");
  admin.walletBalance += amount;
  await admin.save();

  return true;
}

async function autoDeductJoiningFee(user) {
  if (!user.joiningFeePaid && user.walletBalance >= JOINING_FEE) {
    await handlePayment(user._id, JOINING_FEE);
    user.joiningFeePaid = true;
    await user.save();
    await companyController.addJoiningFee(`${user.name} (${user._id})`, JOINING_FEE);
    return true;
  }
  return false;
}

/* --------------------- USER FUNCTIONS ----------------------- */

const joinUser = async (req, res) => {
  try {
    const { name, email, password, sponsorId, side, aadharNumber, contact } = req.body;

    const parent = await User.findOne({ sponsorId });
    if (!parent) return res.status(400).json({ message: "Sponsor not found" });

    if (side === "left" && parent.leftChild)
      return res.status(400).json({ message: "Left child already filled" });
    if (side === "right" && parent.rightChild)
      return res.status(400).json({ message: "Right child already filled" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const { pin: plainPin, hashedPin } = await createEncryptedPin(6);

    const spnsrId = await generateSponsorId();
    const accountNumber = await generateAccountNumber();

    const newUser = new User({
      userId: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      pin: hashedPin,
      parent: parent._id,
      sponsorId: spnsrId,
      accountNumber,
      aadharNumber,
      contact,
      walletBalance: 0,
      joiningFeePaid: false,
      commissionEarned: 0,
      joiningFee: JOINING_FEE,
    });

    await newUser.save();

    if (side === "left") parent.leftChild = newUser._id;
    if (side === "right") parent.rightChild = newUser._id;
    await parent.save();

    await companyController.addJoiningFee(`${newUser.name} (${newUser._id})`, newUser.joiningFee);

    await checkCycleCompletion(parent._id);
    if (parent.parent) {
      await checkCycleCompletion(parent.parent);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: newUser,
      plainPin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const creditWallet = async (req, res) => {
  try {
    const { sponsorId, amount } = req.body;
    const user = await User.findOne({ sponsorId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance += Number(amount);
    await user.save();

    let feeDeducted = await autoDeductJoiningFee(user);

    res.json({
      success: true,
      message: feeDeducted
        ? "Wallet credited and joining fee auto-deducted"
        : "Wallet credited successfully",
      walletBalance: user.walletBalance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("parent", "sponsorId name");
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance,
        joiningFeePaid: user.joiningFeePaid,
        commissionEarned: user.commissionEarned,
        contact: user.contact,
        sponsorId: user.sponsorId,
        parentSponsorId: user.parent?.sponsorId || null,
        parentName: user.parent?.name || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* --------------------- OTHER FUNCTIONS ----------------------- */

const getAllUser = async (req, res) => {
  try {
    const users = await User.find().populate("parent").populate("leftChild").populate("rightChild");
    res.json({ status: 200, success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAvailableSide = async (req, res) => {
  try {
    const { sponsorId } = req.body;
    const parent = await User.findOne({ sponsorId });
    if (!parent) return res.json({ success: false, message: "Sponsor not found" });

    const filled = [];
    if (parent.leftChild) filled.push("left");
    if (parent.rightChild) filled.push("right");
    if (filled.length === 2)
      return res.json({ success: false, message: "Both sides filled" });

    res.json({ success: true, available: filled.includes("left") ? "right" : "left" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addPurchase = async (req, res) => {
  try {
    const { sponsorId, productId, productName, price } = req.body;
    const user = await User.findOne({ sponsorId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < price) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    user.walletBalance -= price;
    user.purchases.push({ productId, productName, price });
    await user.save();

    await companyController.addProductSale(`${user.name} (${user._id})`, price);

    res.json({ success: true, message: "Product purchased successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* --------------------- CRON ----------------------- */

cron.schedule("*/1 * * * *", async () => {
  try {
    const users = await User.find({ joiningFeePaid: false, walletBalance: { $gte: JOINING_FEE } });
    for (let user of users) {
      await autoDeductJoiningFee(user);
      console.log(`Joining fee auto-deducted for ${user.email}`);
    }
  } catch (err) {
    console.error("Cron error:", err.message);
  }
});

module.exports = {
  joinUser,
  login,
  creditWallet,
  getAvailableSide,
  getAllUser,
  addPurchase,
};
