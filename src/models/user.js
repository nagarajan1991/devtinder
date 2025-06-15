const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minLength: [2, 'First name must be at least 2 characters long'],
        maxLength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minLength: [2, 'Last name must be at least 2 characters long'],
        maxLength: [50, 'Last name cannot exceed 50 characters']
    },
    emailID: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(value) {
                return validator.isStrongPassword(value, {
                    minLength: 8,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                });
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },
    age: {
        type: Number,
        min: [18, 'Age must be at least 18'],
        max: [100, 'Age cannot exceed 100']
    },
    gender: {
        type: Number,
        required: [true, 'Gender is required'],
        validate: {
            validator: function(value) {
                return [0, 1, 2].includes(value); // 0: Male, 1: Female, 2: Other
            },
            message: 'Gender must be 0 (Male), 1 (Female), or 2 (Other)'
        }
    },
    photoURL: {
        type: String,
        validate: {
            validator: function(value) {
                return validator.isURL(value, {
                    protocols: ['http', 'https'],
                    require_protocol: true
                });
            },
            message: 'Please provide a valid URL for the photo'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // This adds createdAt and updatedAt fields
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Format dates when converting to JSON
            if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString();
            if (ret.updatedAt) ret.updatedAt = new Date(ret.updatedAt).toISOString();
            if (ret.lastLogin) ret.lastLogin = new Date(ret.lastLogin).toISOString();
            return ret;
        }
    }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
