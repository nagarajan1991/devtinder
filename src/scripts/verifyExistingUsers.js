const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/user");

const verifyExistingUsers = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_SECRET);

    // Find all users who are not verified
    const unverifiedUsers = await User.find({ isVerified: { $ne: true } });

    if (unverifiedUsers.length === 0) {
      return;
    }

    // Mark all existing users as verified
    const result = await User.updateMany(
      { isVerified: { $ne: true } },
      { 
        $set: { 
          isVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined
        } 
      }
    );

    // Successfully verified existing users

  } catch (error) {
    console.error("Error verifying existing users:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
verifyExistingUsers();
