// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   sponsorId:{type:String,required:true},
//   parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//   leftChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//   rightChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

//   name: { type: String, required: true },
//   userId: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   pin: { type: String, required: true },

//   profilePic: { type: String },
//   contact: { type: String,required:true },
//   aadharNumber: { type: String },
//   accountNumber: { type: String },

//   walletBalance: { type: Number, default: 0 },

//   // NEW FIELDS
//   joiningFee: { type: Number, default: 0 },  // joining fee paid
//   purchases: [
//     {
//       productId: String,
//       productName: String,
//       price: Number,
//       date: { type: Date, default: Date.now }
//     }
//   ],
//   commissionEarned: { type: Number, default: 0 }, // total commission user received

//   role: { type: String, enum: ["admin", "user"], default: "user" },
//   createdAt:{
//     type:Date,
//     default:Date.now()
//   },
//   cycleCompleted:{
//     type:Number,
//     default:0
//   },
//   joiningFeePaid:{
//     type:Boolean,
//     default:false
//   }
  
// });

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  sponsorId: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  leftChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  rightChild: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pin: { type: String, required: true },

  profilePic: { type: String },
  contact: { type: String, required: true },
  aadharNumber: { type: String },
  accountNumber: { type: String },

  walletBalance: { type: Number, default: 0 },
  commissionEarned: { type: Number, default: 0 },

  joiningFee: { type: Number, default: 2000 },
  joiningFeePaid: { type: Boolean, default: false },

  purchases: [
    {
      productId: String,
      productName: String,
      price: Number,
      date: { type: Date, default: Date.now },
    },
  ],

  cyclesCompleted: { type: Number, default: 0 },
   cycleCompletedFlag: { type: Boolean, default: false }, // prevent double commission

  role: { type: String, enum: ["admin", "user"], default: "user" },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
