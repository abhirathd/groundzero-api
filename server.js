require("dotenv").config();
const mongoose = require("mongoose");
var mongourl = process.env.MONGODB_URL;
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server running");
});

app.post("/authenticate_user", async (req, res) => {
  res.send(true);
});

mongoose
  .connect(mongourl)
  .then(async () => {
    // Start your Express app after ensuring the collection is created
    const server = app.listen(PORT, () => {
      console.log("App is listening on port:", PORT);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
