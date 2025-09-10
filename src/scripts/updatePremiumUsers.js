const mongoose = require("mongoose");
const User = require("../models/user");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function updatePremiumUsers() {
  try {
    if (!process.env.DB_CONNECTION_SECRET) {
      throw new Error("DB_CONNECTION_SECRET not found in environment variables");
    }
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);

    // Find all premium users without expiry date
    const users = await User.find({
      isPremium: true,
      membershipExpiry: { $exists: false }
    });


    // Set expiry date to 30 days from now for each user
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    for (const user of users) {
      user.membershipExpiry = expiryDate;
      await user.save();
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating users:", error);
    process.exit(1);
  }
}

updatePremiumUsers();
