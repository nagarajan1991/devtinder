const express = require("express");
const premiumRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");

// Endpoint to verify premium membership status
premiumRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    
    // Check if membership has expired
    if (user.isPremium && user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      if (now > expiry) {
        user.isPremium = false;
        user.membershipType = "none";
        await user.save();
      }
    }

    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (user.isPremium && user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }

    return res.json({
      isPremium: user.isPremium,
      membershipType: user.membershipType,
      daysUntilExpiry
    });
  } catch (err) {
    console.error("Error verifying premium status:", err);
    return res.status(500).json({ msg: "Error verifying premium status" });
  }
});

premiumRouter.get("/premium/limits", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    
    // Check if membership has expired
    if (user.isPremium && user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      if (now > expiry) {
        user.isPremium = false;
        user.membershipType = "none";
        await user.save();
      }
    }

    // Reset daily decision count if it's a new day
    if (user.lastDecisionDate) {
      const lastDecision = new Date(user.lastDecisionDate);
      if (lastDecision.getDate() !== now.getDate() || 
          lastDecision.getMonth() !== now.getMonth() || 
          lastDecision.getFullYear() !== now.getFullYear()) {
        user.dailyDecisionCount = 0;
        user.lastDecisionDate = now;
        await user.save();
      }
    }

    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (user.isPremium && user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }

    return res.json({
      isPremium: user.isPremium,
      membershipType: user.membershipType,
      dailyDecisionCount: user.dailyDecisionCount || 0,
      daysUntilExpiry
    });
  } catch (err) {
    console.error("Error checking premium limits:", err);
    return res.status(500).json({ msg: "Error checking premium limits" });
  }
});

// Endpoint to increment decision count
premiumRouter.post("/premium/increment-decision", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // Reset count if it's a new day
    if (user.lastDecisionDate) {
      const lastDecision = new Date(user.lastDecisionDate);
      if (lastDecision.getDate() !== now.getDate() || 
          lastDecision.getMonth() !== now.getMonth() || 
          lastDecision.getFullYear() !== now.getFullYear()) {
        user.dailyDecisionCount = 0;
      }
    }

    // Increment decision count
    user.dailyDecisionCount = (user.dailyDecisionCount || 0) + 1;
    user.lastDecisionDate = now;
    await user.save();

    return res.json({
      dailyDecisionCount: user.dailyDecisionCount
    });
  } catch (err) {
    console.error("Error incrementing decision count:", err);
    return res.status(500).json({ msg: "Error incrementing decision count" });
  }
});

module.exports = premiumRouter;
