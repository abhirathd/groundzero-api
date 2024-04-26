require("dotenv").config();
const mongoose = require("mongoose");
var mongourl = process.env.MONGODB_URL;
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const {randomBytes} = require("crypto")
const User = require("./models/userModel");

const generateToken = () => {
  return randomBytes(20).toString("hex");
};

app.use(bodyParser.urlencoded({ extended: false }));
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server running...")
});

app.post("/create_user", async (req, res) => {
  const userData = await req.body

  const customer_id = generateToken()
  const name = userData["name"]
  const email = userData["email"]
  const phone = userData["phone"]
  const broker = userData["broker"]
  const broker_user_id = userData["broker_user_id"]
  
  const getUser = await User.findOne({customer_id: customer_id})
  if(!getUser) {
    var customer = await new User({
      customer_id: customer_id,
      name: name,
      email: email,
      phone: phone,
      broker: broker,
      broker_user_id: broker_user_id
    });
    customer.save()
    res.send({"status": true, "message": "Account successfully created."})
  }
  else {
    res.send({"status": false, "message": "Customer ID already exists, please try again."})
  }
  
})

function authenicateZerodha(broker_user_id, encToken) {
  const headers = {
    Authorization: `enctoken ${encToken}`,
  };

  const rootUrl = "https://api.kite.trade";

  axios
    .get(rootUrl + "/user/profile", { headers })
    .then(async (response) => {
      // Handle response data
      if(response.data["status"] == "success") {
        if("user_id" in response.data["data"]) {
          if(broker_user_id == response.data["data"]["user_id"]) {
            const getCustomer = await User.findOne({broker_user_id: response.data["data"]["user_id"]})
            if(getCustomer) {
              return true
            }
          }
        }
      }
      return false
    })
    .catch((error) => {
      return false
    });
}

app.post("/authenticate_user", async (req, res) => {

  const authBody = await req.body;

  const broker = authBody["broker"]
  const broker_user_id = authBody["broker_user_id"]

  console.log(broker)

  const encToken = authBody["encToken"];

  const getUser = await User.findOne({broker: broker, broker_user_id: broker_user_id})
  if(!getUser) {
    return res.send({"status": false, "message": "Invalid user. Please contact administrator."})
  }
  
  if(broker == "zerodha") {
    var customerAuth = authenicateZerodha(broker_user_id, encToken)
    if(customerAuth) {
      return res.send({"status": true, "message": "Authentication successful."})
    } else {
      return res.send({"status": false, "message": "Authentication failed. Please contact administrator."})
    }
  }
});

app.get("/getallusers", async (request, response) => {
  const users = await User.find();
  response.json(users);
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
