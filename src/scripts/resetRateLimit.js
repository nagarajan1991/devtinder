const rateLimit = require('express-rate-limit');

// This script can be used to reset rate limiting for development
// Run with: node src/scripts/resetRateLimit.js

console.log('Rate limit reset script');
console.log('Note: Rate limiting is stored in memory and will reset when the server restarts');
console.log('To reset rate limits, restart your development server with: npm run dev');
console.log('');
console.log('Current rate limit configurations:');
console.log('- General API: 1000 requests/15min (localhost) vs 100 (production)');
console.log('- Login: 50 attempts/15min (localhost) vs 5 (production)');
console.log('- Signup: 20 attempts/hour (localhost) vs 3 (production)');
console.log('- Connection requests: 200/hour (localhost) vs 20 (production)');
console.log('');
console.log('If you\'re still hitting limits, restart the server or wait for the time window to reset.');
