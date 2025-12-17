const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number, required: true },
  source: { type: String, required: true }, // e.g., "Cycle Completion", "Matching Bonus"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Commission", commissionSchema);
