const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const { getOnlineUsers } = require("../utils/socket");
const crypto = require("crypto");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

// Deterministic shuffle function using seed
function deterministicShuffle(array, seed) {
  // Create a simple hash from the seed
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const seedNum = parseInt(hash.substring(0, 8), 16);
  
  // Fisher-Yates shuffle with seeded random
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  
  // Simple seeded random number generator
  let randomSeed = seedNum;
  function seededRandom() {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  }
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}

// Get another user's profile
userRouter.get("/user/profile/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(USER_SAFE_DATA);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all the pending connection request for the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);
    // }).populate("fromUserId", ["firstName", "lastName"]);

    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    req.statusCode(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);


    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId  toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA);

    // Create deterministic shuffle based on user ID and date
    // This ensures same order for same user within the same day, but different order for different users
    // The feed refreshes daily but stays consistent throughout the day
    const userSpecificSeed = loggedInUser._id.toString() + new Date().toDateString();
    const shuffledUsers = deterministicShuffle(users, userSpecificSeed);
    
    // Apply pagination after shuffling
    const paginatedUsers = shuffledUsers.slice(skip, skip + limit);

    res.json({ data: paginatedUsers });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get online users (optional endpoint for debugging or admin purposes)
userRouter.get("/user/counts", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const onlineUsers = new Set(getOnlineUsers());

    // Get all connection requests (both connections and ignored)
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).populate('fromUserId toUserId');

    // Count connections and ignored users
    const connections = new Set();
    const ignoredUsers = new Set();
    let connectionsOnlineCount = 0;
    let ignoredOnlineCount = 0;

    connectionRequests.forEach(req => {
      const otherUser = req.fromUserId._id.toString() === loggedInUser._id.toString() 
        ? req.toUserId 
        : req.fromUserId;
      
      // Consider both accepted and interested as connections
      if (req.status === 'accepted' || req.status === 'interested') {
        connections.add(otherUser._id.toString());
        if (onlineUsers.has(otherUser._id.toString())) {
          connectionsOnlineCount++;
        }
      } else if (req.status === 'ignored') {
        ignoredUsers.add(otherUser._id.toString());
        if (onlineUsers.has(otherUser._id.toString())) {
          ignoredOnlineCount++;
        }
      }
      
      // Log for debugging
    });

    // Get total users count (excluding self)
    const totalUsers = await User.countDocuments({ _id: { $ne: loggedInUser._id } });
    
    // Get total online users (excluding self)
    const totalOnline = onlineUsers.size - (onlineUsers.has(loggedInUser._id.toString()) ? 1 : 0);

    const response = {
      availableToConnect: totalUsers - connections.size - ignoredUsers.size,
      onlineCount: totalOnline - connectionsOnlineCount - ignoredOnlineCount,
      debug: {
        totalUsers,
        connectionsCount: connections.size,
        ignoredCount: ignoredUsers.size,
        totalOnline,
        connectionsOnlineCount,
        ignoredOnlineCount
      }
    };
    
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = userRouter;