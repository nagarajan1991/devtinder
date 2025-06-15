require('dotenv').config();
const express = require('express');
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
const auth = require('./middlewares/auth');
const validator = require('validator');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// Validation middleware
const validateSignupData = (req, res, next) => {
    const { firstName, lastName, emailID, password, age, gender } = req.body;
    const errors = [];

    if (!firstName || !validator.isLength(firstName, { min: 2, max: 50 })) {
        errors.push('First name must be between 2 and 50 characters');
    }

    if (!lastName || !validator.isLength(lastName, { min: 2, max: 50 })) {
        errors.push('Last name must be between 2 and 50 characters');
    }

    if (!emailID || !validator.isEmail(emailID)) {
        errors.push('Please provide a valid email address');
    }

    if (!password || !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        errors.push('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    if (age && (!validator.isInt(String(age)) || age < 18 || age > 100)) {
        errors.push('Age must be between 18 and 100');
    }

    if (![0, 1, 2].includes(gender)) {
        errors.push('Gender must be 0 (Male), 1 (Female), or 2 (Other)');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

// Signup API with validation
app.post("/signup", validateSignupData, async(req, res) => {
    try {
        const existingUser = await User.findOne({ emailID: req.body.emailID });
        if (existingUser) {
            return res.status(400).send("Email already exists");
        }

        const user = new User(req.body);
        await user.save();
        res.status(201).send("User added successfully");
    }
    catch (err) {
        res.status(400).send("Error saving the user: " + err.message);
    }
});

// Helper function to format user response
const formatUserResponse = (user) => {
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        emailID: user.emailID,
        age: user.age,
        gender: user.gender,
        photoURL: user.photoURL,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
    };
};

// Login API with cookie
app.post("/login", async(req, res) => {
    try {
        const { emailID, password } = req.body;

        // Validate required fields
        if (!emailID || !password) {
            return res.status(400).json({
                error: "Missing required fields",
                required: {
                    emailID: "Email address is required",
                    password: "Password is required"
                }
            });
        }

        // Validate email format
        if (!validator.isEmail(emailID)) {
            return res.status(400).json({
                error: "Invalid email format",
                message: "Please provide a valid email address"
            });
        }

        // Find user by email
        const user = await User.findOne({ emailID });
        if (!user) {
            return res.status(401).json({
                error: "Authentication failed",
                message: "Invalid email or password"
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: "Authentication failed",
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        // Send response
        res.json({ 
            message: "Login successful", 
            user: formatUserResponse(user)
        });
    }
    catch (err) {
        res.status(500).json({
            error: "Server error",
            message: "Error during login: " + err.message
        });
    }
});

// Logout API
app.post("/logout", auth, async(req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token');
        res.send({ message: "Logged out successfully" });
    }
    catch (err) {
        res.status(500).send("Error during logout: " + err.message);
    }
});

// Update user by email
app.patch("/user/email/:email", auth, async(req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['firstName', 'lastName', 'age', 'gender', 'photoURL'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' });
        }

        const user = await User.findOneAndUpdate(
            { emailID: req.params.email },
            req.body,
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.send(formatUserResponse(user));
    }
    catch (err) {
        res.status(400).send("Error updating user: " + err.message);
    }
});

// Protected routes - require authentication
// Get user by email
app.get("/user/email/:email", auth, async(req, res) => {
    try {
        const user = await User.findOne({ emailID: req.params.email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send(formatUserResponse(user));
    }
    catch (err) {
        res.status(500).send("Error finding user: " + err.message);
    }
});

// Get user by ID
app.get("/user/:id", auth, async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send(formatUserResponse(user));
    }
    catch (err) {
        res.status(500).send("Error finding user: " + err.message);
    }
});

// Feed API - Get all users
app.get("/feed", auth, async(req, res) => {
    try {
        const users = await User.find({});
        res.send(users.map(user => formatUserResponse(user)));
    }
    catch (err) {
        res.status(500).send("Error fetching users: " + err.message);
    }
});

// Delete user API
app.delete("/user/:id", auth, async(req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send("User deleted successfully");
    }
    catch (err) {
        res.status(500).send("Error deleting user: " + err.message);
    }
});

// Profile API - Get logged in user's details
app.get("/profile", auth, async(req, res) => {
    try {
        // req.user is already populated by auth middleware
        res.send(formatUserResponse(req.user));
    }
    catch (err) {
        res.status(500).send("Error fetching profile: " + err.message);
    }
});

connectDB()
.then(() => {
    console.log("Database connected");
    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
})
.catch((err) => {
    console.log("Database connection failed");
    console.log(err);
    process.exit(1);
}); 

