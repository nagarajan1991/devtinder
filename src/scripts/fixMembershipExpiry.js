const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/user");

const fixMembershipExpiry = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);

    // Find all premium users
    const premiumUsers = await User.find({ 
      isPremium: true, 
      membershipExpiry: { $exists: true, $ne: null } 
    });


    for (const user of premiumUsers) {
      const now = new Date();
      const expiry = new Date(user.membershipExpiry);
      
      // Calculate days until expiry
      const timeDiff = expiry.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      
      // If membership has expired, downgrade user
      if (now > expiry) {
        await User.findByIdAndUpdate(user._id, {
          isPremium: false,
          membershipType: "none",
          membershipExpiry: null
        });
      }
    }

  } catch (error) {
    console.error("Error fixing membership expiry:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
fixMembershipExpiry();
