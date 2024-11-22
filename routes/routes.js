const express = require("express");
const path = require("path");
const router = express.Router();

// Route to serve the Home page
router.get("/Home", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Home.html"));
});

// Route to serve the Books page
router.get("/Books", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Books.html"));
});

// Route to serve the Orders page
router.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/orders.html"));
});

// Default route to Login page
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Login.html"));
});

// Route to serve the Register page
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/Register.html"));
});

module.exports = router;
