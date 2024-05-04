require("dotenv").config();
const mongoose = require("mongoose");
var mongourl = process.env.MONGODB_URL;
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const {randomBytes} = require("crypto")
const User = require("./models/userModel");
const path = require('path');
const accountRoutes = require("./routers/accountsRoute")

// Dynamically import AdminJS
import('adminjs').then((module) => {
  const AdminJS = module.default;

  // Dynamically import AdminJSExpress and AdminJSMongoose
  Promise.all([
    import('@adminjs/express'),
    import('@adminjs/mongoose')
  ]).then(([AdminJSExpress, AdminJSMongoose]) => {
    // Now you can use AdminJS, AdminJSExpress, and AdminJSMongoose here
    // Register Mongoose adapter
    AdminJS.registerAdapter(AdminJSMongoose);

    // Very basic configuration of AdminJS.
    const adminJs = new AdminJS({
      resources:[
        {resource: User},
      ],
      rootPath: "/admin", // Path to the AdminJS dashboard.
    });

    // Build and use a router to handle AdminJS routes.
    const router = AdminJSExpress.buildAuthenticatedRouter(adminJs,
      {
        cookieName: "adminjs",
        cookiePassword: "complicatedsecurepassword",
        authenticate: async (username, password) => {
          if(username == process.env.ADMIN_USERNAME && password == process.env.ADMIN_PASSWORD) {
            return true;
          }
          return false;
        },
      },
      null,
      // Add configuration required by the express-session plugin.
      {
        resave: false, 
        saveUninitialized: true,
      });
    app.use(adminJs.options.rootPath, router);
    app.use(express.json());

  }).catch((error) => {
    console.error('Error loading modules:', error);
  });
}).catch((error) => {
  console.error('Error loading AdminJS:', error);
});

// app.use(bodyParser.urlencoded({ extended: false }));
// Set the directory for static files (like CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors())
const PORT = process.env.PORT || 3000;

app.use("/accounts", accountRoutes);

app.get("/", (req, res) => {
  res.send("Server running...")
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
