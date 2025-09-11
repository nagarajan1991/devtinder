const rateLimit = require('express-rate-limit');

// Helper function to check if request is from localhost
const isLocalhost = (req) => {
  return req.ip === '127.0.0.1' || 
         req.ip === '::1' || 
         req.ip === '::ffff:127.0.0.1' ||
         req.hostname === 'localhost';
};

// General API rate limiter - More lenient for localhost
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // More lenient limits for localhost development
    return isLocalhost(req) ? 1000 : 100;
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Login rate limiter - More lenient for localhost
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // More lenient limits for localhost development
    return isLocalhost(req) ? 50 : 5;
  },
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Signup rate limiter - More lenient for localhost
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // More lenient limits for localhost development
    return isLocalhost(req) ? 20 : 3;
  },
  message: {
    success: false,
    message: 'Too many signup attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many signup attempts, please try again after 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Password reset rate limiter - 3 attempts per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again after 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Email verification rate limiter - 5 attempts per hour
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email verification requests per hour
  message: {
    success: false,
    message: 'Too many email verification attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many email verification attempts, please try again after 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Payment rate limiter - 10 attempts per hour
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment attempts per hour
  message: {
    success: false,
    message: 'Too many payment attempts, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many payment attempts, please try again after 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Chat rate limiter - 60 messages per minute
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 chat messages per minute
  message: {
    success: false,
    message: 'Too many chat messages, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many chat messages, please slow down.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Connection request rate limiter - More lenient for localhost
const connectionRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // More lenient limits for localhost development
    return isLocalhost(req) ? 200 : 20;
  },
  message: {
    success: false,
    message: 'Too many connection requests, please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many connection requests, please try again after 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  paymentLimiter,
  chatLimiter,
  connectionRequestLimiter
};
