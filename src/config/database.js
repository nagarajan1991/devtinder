const mongoose = require('mongoose');

const connectDB = async() => {
    await mongoose.connect(
    "mongodb+srv://naga_rw:Benz123@cluster0.pmmnf.mongodb.net/DevTinder?retryWrites=true&w=majority&appName=Cluster0"
    );
}

module.exports = connectDB;

