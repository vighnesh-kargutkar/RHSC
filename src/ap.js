const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const { json } = require("express");
const app = express();
const port = 4000;
require("./comm");
const Register = require("./comm");
const { redirect } = require("express/lib/response");
const async = require("hbs/lib/async");

const static_path = path.join(__dirname, "../public");
app.use(express.static(static_path));
const views_path = path.join(__dirname, "../views");
app.use(express.static(views_path));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("views engine", "ejs");

app.get("", (req, res) => {
  res.send("hello");
});

app.post("/loc", async (req, res) => {
  const lattitude = req.body.lats;
  const longitude = req.body.longs;
  console.log(lattitude, longitude);
  const getDocument = async () => {
    const schema = new mongoose.Schema();
    const marker = mongoose.model("marker", schema);
    const result = await marker
      .find(
        {
          lat: { $lte: lattitude },
          lng: { $lte: longitude },
          lat: { $gte: lattitude },
          lng: { $gte: longitude },
        },
        { name: 1, address: 1 }
      )
      .limit(10);
    console.log(result);
  };
  getDocument();
  res.render(index);
});

app.post("/reg", async (req, res) => {
  try {
    const email = req.body.email;
    const usermail = await Register.find({
      email: email,
    });
    if (usermail.email === email) {
      res.send("email already exist");
    } else {
      const password = req.body.password;
      const cpassword = req.body.confirmpassword;
      if (password === cpassword) {
        const registerpatients = new Register({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          password: req.body.password,
          confirmpassword: req.body.confirmpassword,
        });
        const registered = await registerpatients.save();
        return res.status(201).render(index);
      } else {
        res.send("password not matching");
      }
    }
  } catch {
    res.status(400).send("error");
  }
});

// login form
app.post("/index.html", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const usermail = await Register.findOne({
      email: email,
      password: password,
    });
    console.log(usermail);
    if (usermail.password === password) {
      return res.render(index);
    } else {
      res.send("password are not matching");
    }
  } catch (error) {
    res.status(400).send("error");
  }
});

app.get("*", (req, res) => {
  res.send("404 not found");
});
console.log(__dirname, "../public/index.html");
app.listen(port, () => {
  console.log(`connected ${port}`);
});
