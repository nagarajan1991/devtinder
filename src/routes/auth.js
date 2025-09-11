const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { userAuth } = require("../middlewares/auth");
const crypto = require("crypto");
const { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail } = require("../utils/emailTemplates");
const { 
  loginLimiter, 
  signupLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} = require("../middlewares/rateLimiter");

authRouter.post("/signup", signupLimiter, async (req, res) => {
  try {
    // Validation of data
    validateSignUpData(req);

    const { 
      firstName, 
      lastName, 
      emailId, 
      password, 
      age, 
      gender, 
      photoUrl, 
      about, 
      skills 
    } = req.body;

    // Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    //   Creating a new instance of the User model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      photoUrl,
      about,
      skills,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationTokenExpiry
    });

    await user.save();
    
    // Send email verification email
    try {
      await sendEmailVerificationEmail(user.emailId, user.firstName, verificationToken);
    } catch (emailErr) {
      // Failed to send verification email
      // Don't fail signup if email fails
    }
    
    // Return the created user (excluding password)
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      age: user.age,
      gender: user.gender,
      photoUrl: user.photoUrl,
      about: user.about,
      skills: user.skills,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(201).json({
      message: "Signup successful! Please check your email inbox/spam/junk folder to verify your account before logging in.",
      user: userResponse
    });
  } catch (err) {
    // Handle duplicate email error specifically
    if (err.code === 11000 && err.keyPattern && err.keyPattern.emailId) {
      return res.status(400).json({ 
        message: "A user with this email address already exists. Please use a different email or try logging in." 
      });
    }
    
    // Handle validation errors from validateSignUpData
    if (err.message && (err.message.includes("not valid") || err.message.includes("strong Password"))) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    
    // Handle other validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: errors 
      });
    }
    
    // Handle other errors
    console.error("Signup error:", err);
    res.status(400).json({ 
      message: "An error occurred during signup. Please try again." 
    });
  }
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      throw new Error("Email not verified. Please check your email inbox/spam/junk folder and click the verification link before logging in.");
    }
    
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 3600000), // 7 days to match JWT expiration
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      res.send(user);
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ 
      message: err.message || "An error occurred during login. Please try again." 
    });
  }
});

// Dedicated password change endpoint
authRouter.patch("/change-password", userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      throw new Error("Current password and new password are required");
    }

    // Validate new password strength
    if (!validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      throw new Error("New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character");
    }

    // Get user from auth middleware
    const user = req.user;

    // Validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Check if new password is same as current
    const isNewPasswordSame = await user.validatePassword(newPassword);
    if (isNewPasswordSame) {
      throw new Error("New password must be different from current password");
    }

    // Hash and save new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.password = newPasswordHash;
    await user.save();

    res.json({ 
      message: "Password changed successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        photoUrl: user.photoUrl,
        age: user.age,
        gender: user.gender,
        about: user.about,
        skills: user.skills,
        isPremium: user.isPremium,
        membershipType: user.membershipType,
        membershipExpiry: user.membershipExpiry,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(400).json({ 
      message: err.message || "An error occurred while changing password. Please try again." 
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });
  res.send("Logout Successful!!");
});

// Forgot password - send reset email
authRouter.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ emailId: emailId.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: "If an account with that email exists, we've sent a password reset link." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user.emailId, user.firstName, resetToken);
    } catch (emailErr) {
      // Failed to send password reset email
      // Don't fail the request if email fails
    }

    res.json({ 
      message: "If an account with that email exists, we've sent a password reset link." 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Error processing forgot password request" });
  }
});

// Reset password - verify token and update password
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Validate new password strength
    if (!validator.isStrongPassword(newPassword, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      return res.status(400).json({ 
        message: "New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character" 
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Email verification endpoint
authRouter.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Find user with verification token (check if token exists first)
    const userWithToken = await User.findOne({
      emailVerificationToken: token
    });

    if (!userWithToken) {
      return res.status(400).json({ message: "Invalid verification token. Please request a new verification email." });
    }

    // Check if token has expired
    if (userWithToken.emailVerificationExpires && userWithToken.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: "Verification token has expired. Please request a new verification email." });
    }

    // Check if user is already verified
    if (userWithToken.isVerified) {
      return res.status(200).json({ message: "This email address has already been verified. You can log in normally." });
    }

    const user = userWithToken;

    // Mark user as verified and clear verification token
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Error verifying email" });
  }
});

// Resend verification email endpoint
authRouter.post("/resend-verification", emailVerificationLimiter, async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ emailId: emailId.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        message: "If an account with that email exists and is not verified, we've sent a new verification email." 
      });
    }

    if (user.isVerified) {
      return res.json({ 
        message: "This email is already verified. You can log in normally." 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save new verification token to user
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationTokenExpiry;
    await user.save();

    // Send verification email
    try {
      await sendEmailVerificationEmail(user.emailId, user.firstName, verificationToken);
    } catch (emailErr) {
      // Failed to resend verification email
      // Don't fail the request if email fails
    }

    res.json({ 
      message: "If an account with that email exists and is not verified, we've sent a new verification email." 
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Error resending verification email" });
  }
});

module.exports = authRouter;