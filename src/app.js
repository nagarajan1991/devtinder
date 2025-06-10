const express = require('express');
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");

app.use(express.json());

app.post("/signup", async(req,res) => {
    const user = new User(req.body);

    try {
        await user.save();
        res.send("User added successfully");
    }
    catch (err) {
        res.status(400).send("Error saving the user: "+err);
    }
});


connectDB()
.then(() => {
    console.log("Database connected");
    app.listen(3000, () => {
    console.log("Server running on port 3000");
})
})
.catch((err) => {
    console.log("Database connection failed");
    console.log(err);
    process.exit(1);
}); 

