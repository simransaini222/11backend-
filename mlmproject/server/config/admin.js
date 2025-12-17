const User = require("../api/user/userModel");
const bcrypt = require("bcryptjs");
// const generatePin = require("../utility/generatepin");
const {createEncryptedPin} = require("../utility/generatepin")
require("dotenv").config()

//  Create Admin User
const createAdmin = async (req, res) => {
  try {
   

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role:"admin" });
    if (existingAdmin) {
      console.log("admin is already exist")
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const {pin,hashedPin} = await createEncryptedPin(6)
    console.log(pin)
    

    // Create admin
    const admin = new User({
      sponsorId:process.env.ADMIN_SPONSOR_ID,
      userId:process.env.ADMIN_USERID,
      name:process.env.ADMIN_NAME,
      email:process.env.ADMIN_EMAIL,
      password: hashedPassword,
      pin: hashedPin,
      profilePic: "", 
      contact:process.env.ADMIN_CONTACT,
      aadharNumber:process.env.ADMIN_AADHARNUMBER,
      parent: null,
      leftChild: null,
      rightChild: null,
      walletBalance: 0,
       accountNumber:process.env.ADMIN_ACCOUNTNUMBER,
       role:"admin"
    });

    await admin.save();

    console.log("admin creted successfully")
  } catch (err) {
    console.log("admin is not created due to some kind of error",err.message)
  }
};

module.exports = {createAdmin};
