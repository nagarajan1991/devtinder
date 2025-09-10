const mongoose = require("mongoose");
const User = require("../models/user");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function checkMembership() {
  try {
    if (!process.env.DB_CONNECTION_SECRET) {
      throw new Error("DB_CONNECTION_SECRET not found in environment variables");
    }
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);

    // Find all premium users
    const users = await User.find({
      isPremium: true
    });


    for (const user of users) {
      const now = new Date();
      const expiry = user.membershipExpiry ? new Date(user.membershipExpiry) : null;
      const daysUntilExpiry = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;

      // User premium status
        membershipType: user.membershipType,
        membershipExpiry: user.membershipExpiry,
        daysUntilExpiry,
        rawExpiryDate: expiry ? expiry.toISOString() : null,
        currentTime: now.toISOString()
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking membership:", error);
    process.exit(1);
  }
}

checkMembership();
