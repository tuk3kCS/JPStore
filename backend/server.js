require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
require("./config/passport"); // Import file Passport.js

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connect to MongoDB sucessfully"))
  .catch(err => console.log("❌ Failed to connect to DB:", err));

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.use(session({secret: "supersecret", resave: false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.get (
    "/auth/google",
    passport.authenticate("google", {scope: ["profile", "email"]})
);

app.get (
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.json({message: "Login sucessfully!", user: req.user});
    }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running at http://localhost:${PORT}`));