const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const { sendPremiumUpgradeEmail } = require("../utils/emailTemplates");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: membershipType,
      },
    });

    // Save it in my database

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    // Return back my order details to frontend
    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      return res.status(400).json({ msg: "Webhook signature is invalid" });
    }

    // Update payment Status in DB
    const paymentDetails = req.body.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }
    
    payment.status = paymentDetails.status;
    await payment.save();

    // Only update user membership if payment is captured
    if (req.body.event === "payment.captured" && paymentDetails.status === "captured") {
      const user = await User.findOne({ _id: payment.userId });
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Set membership expiry to 30 days from now
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(now.getDate() + 30);
      expiryDate.setHours(23, 59, 59, 999); // Set to end of day

      // Update all membership fields
      const updates = {
        isPremium: true,
        membershipType: payment.notes.membershipType,
        membershipExpiry: expiryDate
      };
      
      // Use findByIdAndUpdate to ensure all fields are updated
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(500).json({ msg: "Failed to update user membership" });
      }

      // Send premium upgrade email
      try {
        await sendPremiumUpgradeEmail(
          updatedUser.emailId, 
          updatedUser.firstName, 
          updatedUser.membershipType
        );
      } catch (emailErr) {
        // Failed to send premium upgrade email
        // Don't fail the webhook if email fails
      }
    }

    // Update the user as premium

    // if (req.body.event == "payment.captured") {
    // }
    // if (req.body.event == "payment.failed") {
    // }

    // return success response to razorpay

    return res.status(200).json({ msg: "Webhook received successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Manual fix endpoint for membership expiry
paymentRouter.post("/premium/fix-expiry", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.isPremium || !user.membershipType) {
      return res.status(400).json({ msg: "User is not a premium member" });
    }

    // Find the most recent successful payment for this user
    const Payment = require("../models/payment");
    const recentPayment = await Payment.findOne({
      userId: user._id,
      status: "captured"
    }).sort({ createdAt: -1 });

    let subscriptionDate;
    
    if (recentPayment && recentPayment.createdAt) {
      // Use the payment date as subscription date
      subscriptionDate = new Date(recentPayment.createdAt);
    } else {
      // Fallback to user's updatedAt or current date
      subscriptionDate = user.updatedAt || new Date();
    }

    // Set membership expiry to 30 days from subscription date
    const expiryDate = new Date(subscriptionDate);
    expiryDate.setDate(subscriptionDate.getDate() + 30);
    expiryDate.setHours(23, 59, 59, 999);

    const updates = {
      membershipExpiry: expiryDate
    };

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Calculate days until expiry from now
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return res.json({
      message: "Membership expiry fixed successfully",
      membershipExpiry: updatedUser.membershipExpiry,
      daysUntilExpiry: daysUntilExpiry,
      subscriptionDate: subscriptionDate,
      expiryDate: expiryDate
    });
  } catch (err) {
    console.error("Error fixing membership expiry:", err);
    return res.status(500).json({ msg: "Error fixing membership expiry" });
  }
});

// Debug endpoint to check user membership status
paymentRouter.get("/premium/debug", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    
    const debugInfo = {
      userId: user._id,
      isPremium: user.isPremium,
      membershipType: user.membershipType,
      membershipExpiry: user.membershipExpiry,
      currentTime: now.toISOString(),
      daysUntilExpiry: null
    };
    
    if (user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      const timeDiff = expiry.getTime() - now.getTime();
      debugInfo.daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      debugInfo.isExpired = now > expiry;
    }
    
    return res.json(debugInfo);
  } catch (err) {
    console.error("Error in debug endpoint:", err);
    return res.status(500).json({ msg: "Error getting debug info" });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    const user = req.user.toJSON();
    const now = new Date();
    let daysUntilExpiry = null;
    
    // Check if membership has expired
    if (user.isPremium && user.membershipExpiry) {
      const expiry = new Date(user.membershipExpiry);
      
      // Calculate days until expiry - multiple methods for accuracy
      const timeDiff = expiry.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Alternative calculation method
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
      const altTimeDiff = startOfExpiry.getTime() - startOfToday.getTime();
      const altDaysUntilExpiry = Math.ceil(altTimeDiff / (1000 * 60 * 60 * 24));
      
      // Use the more accurate calculation
      daysUntilExpiry = altDaysUntilExpiry;
      
      // If membership has expired, update user status
      if (now > expiry) {
        const userDoc = await User.findById(user._id);
        userDoc.isPremium = false;
        userDoc.membershipType = "none";
        await userDoc.save();
        return res.json({ 
          ...user, 
          isPremium: false, 
          membershipType: "none",
          daysUntilExpiry: 0
        });
      }
    }
    
    // Ensure daysUntilExpiry is never null
    let finalDaysUntilExpiry = daysUntilExpiry;
    if (user.isPremium && user.membershipExpiry && (finalDaysUntilExpiry === null || finalDaysUntilExpiry === undefined)) {
      // Fallback calculation
      const expiry = new Date(user.membershipExpiry);
      const timeDiff = expiry.getTime() - now.getTime();
      finalDaysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }
    
    const response = { 
      ...user,
      daysUntilExpiry: user.isPremium ? (finalDaysUntilExpiry || 0) : 0
    };
    
    return res.json(response);
  } catch (err) {
    console.error("Error verifying premium status:", err);
    return res.status(500).json({ msg: "Error verifying premium status" });
  }
});

module.exports = paymentRouter;