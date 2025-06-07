const express = require('express');

const app = express();

app.use("/",(req,res) => {
    res.send('Hello from the dashboard!');
})

app.use("/hello",(req,res) => {
    res.send('Hello from the server!');
})

app.use("/test",(req,res) => {
    res.send('Test from the server!');
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});