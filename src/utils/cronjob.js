const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const { sendDailyDigestEmail } = require("./emailTemplates");
const ConnectionRequestModel = require("../models/connectionRequest");

// This job will run at 8 AM in the morning everyday
// DISABLED: Cron job temporarily disabled
// cron.schedule("0 8 * * *", async () => {
  // Send emails to all people who got requests the previous day
  try {
    const yesterday = subDays(new Date(), 1);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequests = await ConnectionRequestModel.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    const listOfEmails = [
      ...new Set(pendingRequests.map((req) => req.toUserId.emailId)),
    ];


    for (const email of listOfEmails) {
      // Send Daily Digest Emails
      try {
        // Count pending requests for this user
        const userPendingCount = pendingRequests.filter(req => req.toUserId.emailId === email).length;
        
        // Get recent connections for this user (last 7 days)
        const recentConnections = await ConnectionRequestModel.find({
          $or: [
            { fromUserId: pendingRequests.find(req => req.toUserId.emailId === email)?.toUserId._id },
            { toUserId: pendingRequests.find(req => req.toUserId.emailId === email)?.toUserId._id }
          ],
          status: "accepted",
          updatedAt: { $gte: subDays(new Date(), 7) }
        }).populate("fromUserId toUserId", "firstName lastName photoUrl");
        
        const res = await sendDailyDigestEmail(email, userPendingCount, recentConnections);
      } catch (err) {
        console.error(`Failed to send daily digest to ${email}:`, err);
      }
    }
  } catch (err) {
    console.error(err);
  }
// });