const express = require("express");
const https = require("https");
const qs = require("querystring");
const app = express();
const cookieParser = require("cookie-parser");
const date = require("date");
const mongoose = require("mongoose");
const http = require("http");
const server = http.createServer(app);
const ejs = require("ejs");
const fs = require("fs");
const socketio = require("socket.io");
const io = socketio(server);
const { v4: uuidV4 } = require("uuid");
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
const alert = require("alert");
const { check, validationResult } = require("express-validator");

// const io = require("socket.io")(server);
const formatMessage = require("./chatmessage");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./chatuser");

require("./patient");
require("./docter");
require("./marker");
require("./disea");
require("./medic");
require("./appbook");
require("../public/bookpage");
require("./appmail");

const patient = require("./patient");
const marker = require("./marker");
const disease = require("./disea");
const medicine = require("./medic");
const docter = require("./docter");
const appoinment = require("./appbook");
const multer = require("multer");
const path = require("path/posix");
const { start } = require("repl");
const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");
const { parse } = require("path/posix");
const review = require("./review");
const { min } = require("moment");
const { max } = require("moment");
// const docter = require("./docter");
// const patient = require("./patient");
const Port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
// app.use(express.urlencoded({ extended: false }));
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
app.use(cookieParser());

const botName = "RHSC";
// Run when client connects
io.on("connection", (socket) => {
  // console.log("user connected", socket.id);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    io.to(user.room).emit(
      "message",
      formatMessage(botName, `${user.username} Welcome to RHSC `)
    );
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    // console.log(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});
const Storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: Storage,
  // fileFilter: (req, file, cb) => {
  //   if (
  //     file.mimetype == "image/png" ||
  //     file.mimetype == "image/jpg" ||
  //     file.mimetype == "image/jpeg"
  //   ) {
  //     cb(null, true);
  //   } else {
  //     cb(null, false);
  //     return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  //   }
  // },
}).single("file");
//get methods
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/patientlogout", (req, res) => {
  res.clearCookie("pfname");
  res.clearCookie("plname");
  res.clearCookie("pemail");
  res.clearCookie("pfees");
  res.clearCookie("pphone");
  res.clearCookie("roomid");
  return res.redirect("login");
});
app.get("/home", async (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("home", { pfname, pImage });
});
app.get("/thankyou", (req, res) => {
  res.render("thankyou");
});
app.get("/chaaat", (req, res) => {
  res.render("chaaat");
});
app.get("/chatcopy", (req, res) => {
  res.render("chatcopy");
});
app.get("/alogin", (req, res) => {
  res.render("alogin");
});
app.get("/loginpnm", (req, res) => {
  res.render("loginpnm");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/registeranf", (req, res) => {
  res.render("registeranf");
});
app.get("/consult", async (req, res) => {
  const pfname = req.cookies.pfname;
  const plname = req.cookies.plname;
  const pemail = req.cookies.pemail;
  const pImage = req.cookies.pImage;
  const checkapp = await appoinment.find({
    pemail: pemail,
  });
  var date = new Date();
  var day =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  var ctime =
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2);

  const live = await appoinment.find({
    pemail: pemail,
    date: day,
    time: { $lte: ctime },
    etime: { $gte: ctime },
  });
  const live1 = await appoinment.findOne({
    pemail: pemail,
    date: day,
    time: { $lte: ctime },
    etime: { $gte: ctime },
  });
  if (live1 != null) {
    res.cookie("pfees", live1.fees, {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
    });
    res.cookie("docemail", live1.docemail, {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
    });
    res.cookie("date", live1.date, {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
    });
    res.cookie("Time", live1.time, {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
    });
  }
  const upcomingapp = await appoinment.find({
    pemail: pemail,
    date: { $gte: day },
    // etime: { $lt: ctime },
  });
  const result = await docter.find({});
  res.render("consult", {
    result,
    pfname,
    checkapp,
    live,
    upcomingapp,
    pImage,
  });
});

app.get("/chat", async (req, res) => {
  const rmid = res.cookie.roomid;
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  const pfees = req.cookies.pfees;
  const docemail = req.cookies.docemail;
  console.log(rmid);
  res.render("chat", { pfname, pImage, pfees });
});
app.get("/like", async (req, res) => {
  const docemail = req.cookies.docemail;
  const usermail1 = await docter.findOne({
    email: docemail,
  });
  const usermail = await docter.findOneAndUpdate(
    {
      email: docemail,
    },
    {
      total: usermail1.total + 1,
      like: usermail1.like + 1,
    }
  );
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    "<html><head><title>Review send</title></head><body style=" +
      "background-color: #d5e7f9" +
      "><center><h1 style=" +
      "color: #4535da" +
      ">Like send</h1></center></body></html>"
  );
  res.end();
});
app.get("/dislike", async (req, res) => {
  const docemail = req.cookies.docemail;
  const usermail1 = await docter.findOne({
    email: docemail,
  });
  const usermail = await docter.findOneAndUpdate(
    {
      email: docemail,
    },
    {
      total: usermail1.total + 1,
      dislike: usermail1.dislike + 1,
    }
  );
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    "<html><head><title>Review send</title></head><body style=" +
      "background-color: #d5e7f9" +
      "><center><h1 style=" +
      "color: #4535da" +
      ">Dislike send</h1></center></body></html>"
  );
  res.end();
});
app.post("/writerev", parseUrl, async (req, res) => {
  const docemail = req.cookies.docemail;
  const pemail = req.cookies.pemail;
  const rview = req.body.review;
  const regreview = new review({
    docteremail: docemail,
    patientemail: pemail,
    review: rview,
  });
  const bs = await regreview.save();
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    "<html><head><title>Review send</title></head><body style=" +
      "background-color: #d5e7f9" +
      "><center><h1 style=" +
      "color: #4535da" +
      ">Review send</h1></center></body></html>"
  );
  res.end();
  // res.send("writerev ");
});
app.get("/videoooo", (req, res) => {
  res.redirect(`/${uuidV4()}`);
  app.get("/:room", async (req, res) => {
    const id = req.params.room;
    console.log(id);
    res.cookie("roomid", id);
    res.render("room", { roomId: req.params.room });
  });
});
app.get("/chatdoc", async (req, res) => {
  res.render("chatdoc");
});
app.get("/video", async (req, res) => {
  res.render("video");
});
app.post("/bookapp", parseUrl, async (req, res) => {
  const { doctertype, email, firstname } = req.body;
  const result = await docter.find({
    doctertype: doctertype,
    email: email,
    firstname: firstname,
  });
  const result1 = await review.findOne({}).sort({ _id: -1 });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("bookapp", { result, result1, pfname, pImage, review });
});
app.post("/geteprescription", parseUrl, async (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  const docemail = req.cookies.docemail;
  const pemail = req.cookies.pemail;
  const usermail = await appoinment.findOne({
    docemail: docemail,
    pemail: pemail,
  });
  res.cookie("medprice", usermail.medprice, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  res.render("odermedicine", { pfname, pImage, usermail });
  // res.writeHead(200, { "Content-Type": "text/html" });
  // res.write(
  //   "<html><head><title>Review send</title></head><body><center><h1>" +
  //     usermail.eprescription +
  //     "E prescription send</h1></center></body></html>"
  // );
  // res.end();
});
app.post("/epresciption", parseUrl, async (req, res) => {
  const eps = req.body.eps;
  const epprice = req.body.epprice;
  console.log(epprice);
  const DocterEmail = req.cookies.DocterEmail;
  const patientEmail = req.cookies.apppatemail;
  const date = req.cookies.date;
  const time = req.cookies.Time;
  console.log(DocterEmail, patientEmail);
  const usermail = await appoinment.findOneAndUpdate(
    {
      docemail: DocterEmail,
      date: date,
      time: time,
      pemail: patientEmail,
    },
    {
      eprescription: eps,
      medprice: epprice,
    }
  );
  console.log(usermail);
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    "<html><head><title>Review send</title></head><body style=" +
      "background-color: #d5e7f9" +
      "><center><h1 style=" +
      "color: #4535da" +
      ">E prescription send</h1></center></body></html>"
  );
  res.end();
});
app.post("/confirmappp", parseUrl, async (req, res) => {
  res.status("ok");
});
app.get("/conGynaecologist", async (req, res) => {
  const Gynaecologist = "Gynaecologist";
  const result = await docter.find({ doctertype: Gynaecologist });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conGynaecologist", { result, pfname, pImage });
});
app.get("/conDermatologist", async (req, res) => {
  const Dermatologist = "Dermatologist";
  const result = await docter.find({ doctertype: Dermatologist });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conDermatologist", { result, pfname, pImage });
});
app.get("/conPhysician", async (req, res) => {
  const Physician = "Physician";
  const result = await docter.find({ doctertype: Physician });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conPhysician", { result, pfname, pImage });
});
app.get("/Gastroenterologist", async (req, res) => {
  const Gastroenterologist = "Gastroenterologist";
  const result = await docter.find({ doctertype: Gastroenterologist });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conGastroenterologist", { result, pfname, pImage });
});
app.get("/conPsychiatrist", async (req, res) => {
  const Psychiatrist = "Psychiatrist";
  const result = await docter.find({ doctertype: Psychiatrist });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conPsychiatrist", { result, pfname, pImage });
});
app.get("/conPaediatrician", async (req, res) => {
  const Paediatrician = "Paediatrician";
  const result = await docter.find({ doctertype: Paediatrician });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("conPaediatrician", { result, pfname, pImage });
});
app.get("/medicine", parseUrl, (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("medicine", { pfname, pImage });
});
app.get("/autocomplete", async (req, res) => {
  const regex = new RegExp(req.query["term"], "i");
  const result = disease.find({ name: regex }).limit(10);
  result.exec(function (err, data) {
    const resa = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((user) => {
          const obj = {
            id: user._id,
            label: user.name,
          };
          resa.push(obj);
        });
      }
      res.jsonp(resa);
    }
  });
});
app.get("/autocompletemed", async (req, res) => {
  const regex = new RegExp(req.query["term"], "i");
  const result = medicine.find({ name: regex }).limit(10);
  result.exec(function (err, data) {
    const resa = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((user) => {
          const obj = {
            id: user._id,
            label: user.name,
          };
          resa.push(obj);
        });
      }
      res.jsonp(resa);
    }
  });
});
app.post("/medicine", parseUrl, async (req, res) => {
  const input = req.body.names;
  const result = await medicine.find({ name: input });
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("medicinesss", { result, pfname, pImage });
});
app.post(
  "/disease",
  parseUrl,
  // check("names", "Enter valid input"),
  async (req, res) => {
    // const errors = validationResult(req);
    // if (errors != null) {
    //   // return res.status(422).jsonp(errors.array())
    //   const alert = errors.array();
    //   const pfname = req.cookies.pfname;
    //   const pImage = req.cookies.pImage;
    //   console.log(alert);
    //   res.render("disease", { alert, pfname, pImage });
    // }
    const input = req.body.names;
    const pfname = req.cookies.pfname;
    const pImage = req.cookies.pImage;
    const result = await disease.find({ name: input });
    // console.log(result);
    // if (result != null) {
    res.render("diseasessss", { result, pfname, pImage });
    // } else {
    // res.render("disease", { alert, pfname, pImage });
    // }
  }
);
app.get("/disease", async (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("disease", { pfname, pImage });
});
app.get("/nearby", (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("nearby", { pfname, pImage });
});
app.get("/nearbyss", (req, res) => {
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("nearbyss", { pfname, pImage });
});
app.get("/dochome", parseUrl, async (req, res) => {
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterEmail = req.cookies.DocterEmail;
  const DocterType = req.cookies.DocterType;
  const DocterImage = req.cookies.DocterImage;
  var date = new Date();
  var day =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  var ctime =
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2);
  const live = await appoinment.find({
    docemail: DocterEmail,
    date: day,
    time: { $lte: ctime },
    etime: { $gte: ctime },
  });
  const live1 = await appoinment.findOne({
    docemail: DocterEmail,
    date: day,
    time: { $lte: ctime },
    etime: { $gte: ctime },
  });
  if (live1 != null) {
    res.cookie("apppatemail", live1.pemail, {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
    });
  }
  const Todayapp = await appoinment.find({
    docemail: DocterEmail,
    date: day,
  });
  const totalearning = await appoinment.find({
    docemail: DocterEmail,
  });
  var fees = 0;
  totalearning.forEach((data) => {
    fees += parseInt(data.fees);
  });
  // console.log(fees);
  res.render("dochome", {
    DocterFirstname,
    fees,
    DocterImage,
    live,
    Todayapp,
  });
});
app.get("/docapp", async (req, res) => {
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterEmail = req.cookies.DocterEmail;
  const DocterType = req.cookies.DocterType;
  const DocterImage = req.cookies.DocterImage;
  var date = new Date();
  var day =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  var ctime =
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2);

  const Upcomingapp = await appoinment.find({
    docemail: DocterEmail,
    date: { $gte: day },
  });
  const appHistory = await appoinment.find({
    docemail: DocterEmail,
  });
  res.render("docapp", {
    DocterFirstname,
    DocterImage,
    Upcomingapp,
    appHistory,
  });
});
app.get("/docreg", async (req, res) => {
  res.render("docreg");
});
app.get("/docprofile", async (req, res) => {
  const DocterEmail = req.cookies.DocterEmail;
  const usermail = await docter.findOne({
    email: DocterEmail,
  });
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterType = req.cookies.DocterType;
  const DocterQualification = req.cookies.DocterQualification;
  const DocterExperience = req.cookies.DocterExperience;
  const DocterFees = req.cookies.Docterfees;
  const DocterImage = req.cookies.DocterImage;
  res.render("docprofile", {
    DocterFirstname,
    DocterLastname,
    DocterEmail,
    DocterType,
    DocterQualification,
    DocterExperience,
    DocterFees,
    DocterImage,
  });
});
app.post("/docprofilefees", parseUrl, async (req, res) => {
  const DocterEmail = req.cookies.DocterEmail;
  res.clearCookie("DocterFees");
  const fees = req.body.fees;
  const usermail = await docter.findOneAndUpdate(
    {
      email: DocterEmail,
    },
    {
      fees: fees,
    }
  );
  res.cookie("Docterfees", fees, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterType = req.cookies.DocterType;
  const DocterQualification = req.cookies.DocterQualification;
  const DocterExperience = req.cookies.DocterExperience;
  const DocterFees = fees;
  const DocterImage = req.cookies.DocterImage;
  res.render("docprofile", {
    DocterFirstname,
    DocterLastname,
    DocterEmail,
    DocterType,
    DocterQualification,
    DocterExperience,
    DocterFees,
    DocterImage,
  });
});
app.post("/docprofilequali", parseUrl, async (req, res) => {
  const DocterEmail = req.cookies.DocterEmail;
  res.clearCookie("DocterQualification");
  const qualification = req.body.qualification;
  const usermail = await docter.findOneAndUpdate(
    {
      email: DocterEmail,
    },
    {
      qualification: qualification,
    }
  );
  res.cookie("DocterQualification", qualification, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterType = req.cookies.DocterType;
  const DocterQualification = qualification;
  const DocterExperience = req.cookies.DocterExperience;
  const DocterFees = req.cookies.Docterfees;
  const DocterImage = req.cookies.DocterImage;
  res.render("docprofile", {
    DocterFirstname,
    DocterLastname,
    DocterEmail,
    DocterType,
    DocterQualification,
    DocterExperience,
    DocterFees,
    DocterImage,
  });
});
app.post("/docprofileexp", parseUrl, async (req, res) => {
  const DocterEmail = req.cookies.DocterEmail;
  res.clearCookie("DocterQualification");
  const experience = req.body.experience;
  const usermail = await docter.findOneAndUpdate(
    {
      email: DocterEmail,
    },
    {
      experience: experience,
    }
  );
  res.cookie("DocterExperience", experience, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterType = req.cookies.DocterType;
  const DocterQualification = req.cookies.DocterQualification;
  const DocterExperience = experience;
  const DocterFees = req.cookies.Docterfees;
  const DocterImage = req.cookies.DocterImage;
  res.render("docprofile", {
    DocterFirstname,
    DocterLastname,
    DocterEmail,
    DocterType,
    DocterQualification,
    DocterExperience,
    DocterFees,
    DocterImage,
  });
});
app.post("/docprofileimg", parseUrl, upload, async (req, res) => {
  const DocterEmail = req.cookies.DocterEmail;
  res.clearCookie("DocterImage");
  const image = req.file.filename;
  const usermail = await docter.findOneAndUpdate(
    {
      email: DocterEmail,
    },
    {
      image: image,
    }
  );
  res.cookie("DocterImage", image, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  const DocterFirstname = req.cookies.DocterFirstname;
  const DocterLastname = req.cookies.DocterLastname;
  const DocterType = req.cookies.DocterType;
  const DocterQualification = req.cookies.DocterQualification;
  const DocterExperience = req.cookies.DocterExperience;
  const DocterFees = req.cookies.Docterfees;
  const DocterImage = image;
  res.render("docprofile", {
    DocterFirstname,
    DocterLastname,
    DocterEmail,
    DocterType,
    DocterQualification,
    DocterExperience,
    DocterFees,
    DocterImage,
  });
});
app.get("/patientprofile", async (req, res) => {
  const pfname = req.cookies.pfname;
  const plname = req.cookies.plname;
  const pemail = req.cookies.pemail;
  const pImage = req.cookies.pImage;
  const pphone = req.cookies.pphone;
  const usermail = await patient.findOne({
    email: pemail,
  });
  console.log(pfname, plname, pemail, pImage, pphone);
  res.render("patientprofile", {
    pfname,
    plname,
    pemail,
    pImage,
    pphone,
  });
});
app.post("/patientphone", parseUrl, upload, async (req, res) => {
  const pfname = req.cookies.pfname;
  const plname = req.cookies.plname;
  const pemail = req.cookies.pemail;
  const pImage = req.cookies.pImage;
  res.clearCookie("pphone");
  const pphone = req.body.phone;
  const usermail = await patient.findOneAndUpdate(
    {
      email: pemail,
    },
    {
      phone: pphone,
    }
  );
  res.cookie("pphone", pphone, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  res.render("patientprofile", {
    pfname,
    plname,
    pemail,
    pImage,
    pphone,
  });
});
app.post("/patientprofileimg", parseUrl, upload, async (req, res) => {
  const pfname = req.cookies.pfname;
  const plname = req.cookies.plname;
  const pemail = req.cookies.pemail;
  const pphone = req.cookies.pphone;
  res.clearCookie("pImage");
  const pImage = req.file.filename;
  const usermail = await patient.findOneAndUpdate(
    {
      email: pemail,
    },
    {
      image: pImage,
    }
  );
  res.cookie("pImage", pImage, {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
  });
  res.render("patientprofile", {
    pfname,
    plname,
    pemail,
    pImage,
    pphone,
  });
});
app.post(
  "/login",
  parseUrl,
  check("type").notEmpty().withMessage("Type required."),
  check("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email is not valid ")
    .notEmpty()
    .withMessage("Email required."),
  check("password").notEmpty().withMessage("Password required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const alert = errors.array();
        // return res.status(422).jsonp(errors.array());
        return res.render("login", { alert });
      }
      const email = req.body.email;
      const password = req.body.password;
      const confirmpassword = req.body.confirmpassword;
      const type = req.body.type;
      const pat = "Patient";
      const doc = "Doctor";
      if (type === pat) {
        const usermail = await patient.findOne({
          email: email,
        });
        const pfname = usermail.firstname;
        const pImage = usermail.image;
        const ismatch = await bcrypt.compare(password, usermail.password);
        if (ismatch) {
          res.cookie("pfname", usermail.firstname, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
          res.cookie("plname", usermail.lastname, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
          res.cookie("pemail", usermail.email, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
          res.cookie("pphone", usermail.phone, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
          res.cookie("pImage", usermail.image, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
          res.render("home", { pfname, pImage });
        } else {
          res.render("loginpnm");
        }
      } else if (type === doc) {
        const usermail = await docter.findOne({
          email: email,
        });
        const DocterFirstname = usermail.firstname;
        const DocterLastname = usermail.lastname;
        const DocterEmail = usermail.email;
        const DocterType = usermail.doctertype;
        const DocterImage = usermail.image;
        const DocterQualification = usermail.qualification;
        const DocterExperience = usermail.experience;
        const DocterFees = usermail.fees;
        var date = new Date();
        var day =
          date.getFullYear() +
          "-" +
          ("0" + (date.getMonth() + 1)).slice(-2) +
          "-" +
          ("0" + date.getDate()).slice(-2);
        var ctime =
          ("0" + date.getHours()).slice(-2) +
          ":" +
          ("0" + date.getMinutes()).slice(-2);
        const live = await appoinment.find({
          docemail: DocterEmail,
          date: day,
          time: { $lte: ctime },
          etime: { $gte: ctime },
        });
        const live1 = await appoinment.findOne({
          docemail: DocterEmail,
          date: day,
          time: { $lte: ctime },
          etime: { $gte: ctime },
        });
        if (live1 != null) {
          res.cookie("apppatemail", live1.pemail, {
            secure: process.env.NODE_ENV !== "development",
            httpOnly: true,
          });
        }
        const Todayapp = await appoinment.find({
          docemail: DocterEmail,
          date: day,
        });
        const totalearning = await appoinment.find({
          docemail: DocterEmail,
        });
        var fees = [];
        totalearning.forEach((data) => {
          fees.push(data.fees);
        });
        // console.log(fees);
        res.cookie("DocterFirstname", DocterFirstname, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterLastname", DocterLastname, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterEmail", DocterEmail, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterType", DocterType, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("Docterfees", DocterFees, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterImage", DocterImage, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterQualification", DocterQualification, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        res.cookie("DocterExperience", DocterExperience, {
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
        });
        if (usermail.password === password) {
          return res.render("dochome", {
            DocterFirstname,
            fees,
            DocterImage,
            live,
            Todayapp,
          });
        } else {
          res.render("loginpnm");
        }
      }
    } catch (error) {
      res.status(400).render("registeranf");
    }
  }
);
app.post(
  "/register",
  parseUrl,
  upload,
  check("firstname")
    .notEmpty()
    .withMessage("First Name required.")
    .isAlpha()
    .withMessage("First Name must be alphabetic."),
  check("firstname")
    .notEmpty()
    .withMessage("First Name required.")
    .isAlpha()
    .withMessage("Last Name must be alphabetic."),
  check("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email is not valid ")
    .notEmpty()
    .withMessage("Email required."),
  check("phone")
    .isLength({ min: 10, max: 10 })
    .withMessage("Please enter valid 10 digit number")
    .notEmpty()
    .withMessage("Phone required."),
  check("password")
    .isLength({ min: 5, max: 10 })
    .withMessage("Password should be greater than 5 and lessthen 10")
    .notEmpty()
    .withMessage("Password required"),
  check("confirmpassword")
    .notEmpty()
    .withMessage("confirmpassword required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  check("file").custom((value, { req }) => {
    if (!req.file) throw new Error("Profile Image is required");
    return true;
  }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const alert = errors.array();
        // return res.status(422).jsonp(errors.array());
        return res.render("register", { alert });
      }
      const password = req.body.password;
      const confirmpassword = req.body.confirmpassword;
      if (password == confirmpassword) {
        const registerpatients = new patient({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          phone: req.body.phone,
          email: req.body.email,
          password: req.body.password,
          image: req.file.filename,
        });
        console.log(registerpatients);
        const registered = await registerpatients.save();
        res.render("login");
      }
      // return res.status(201).render("home");
      // }
      else {
        res.send("password not matching");
      }
    } catch {
      res.status(400).send("error");
    }
  }
);
app.post("/confirmapp", parseUrl, async (req, res) => {
  try {
    const docfname = req.body.docfname;
    const doclname = req.body.doclname;
    const docemail = req.body.docemail;
    const doctertype = req.body.doctertype;
    const fees = req.body.fees;
    const date = req.body.date;
    const time = req.body.timee;
    const stime = req.body.timee;
    const pemail = req.cookies.pemail;
    const pfname = req.cookies.pfname;
    const plname = req.cookies.plname;
    const pphone = req.cookies.pphone;
    const a = stime.slice(-2);
    if (a == 00) {
      var endtime = stime.slice(0, -2) + 29;
      // console.log(endtime);
    } else if (a == 30) {
      var endtime = stime.slice(0, -2) + 59;
      // console.log(endtime);
    }
    const checkapp = await appoinment.findOne({
      // docemail: docemail,
      pemail: pemail,
      date: date,
      time: time,
    });
    if (checkapp != null) {
      res.ma;
      window.alert("already booked appointment booked");
      // res.status(200).send("slot already booked");
    } else {
      // console.log(docfname, doclname, docemail, fees, date, time);
      const regapps = new appoinment({
        docfname: docfname,
        doclname: doclname,
        docemail: docemail,
        pemail: pemail,
        pfname: pfname,
        plname: plname,
        doctertype: doctertype,
        pphone: pphone,
        fees: fees,
        time: time,
        etime: endtime,
        date: date,
        eprescription: "",
        medprice: 0,
        ORDERID: "",
        PAYMENTMODE: "",
      });
      const bs = await regapps.save();
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "rhscappointment@gmail.com",
          pass: "RHSC@123",
        },
      });
      var mailOptions = {
        from: "rhscappointment@gmail.com",
        to: `${pemail}`,
        subject: "Appointment",
        text: `Your appointment has been booked for Dr.${docfname}${doclname} on date ${date} ${time}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      alert("appointment booked");
      transporter.close();
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(
        "<html><head><title>Review send</title></head><body style=" +
          "background-color: #d5e7f9" +
          "><center><h1 style=" +
          "color: #4535da" +
          ">Appointment Booked</h1></center></body></html>"
      );
      res.end();
    }
  } catch {
    res.status(400).send("error");
  }
});
app.post("/loc", parseUrl, async (req, res) => {
  const lattitude = req.body.lats;
  const longitude = req.body.longs;
  const result = await marker
    .find({
      location: {
        $near: {
          $maxDistance: 10000000,
          $geometry: {
            type: "Point",
            coordinates: [lattitude, longitude],
          },
        },
      },
    })
    .limit(10);
  const pfname = req.cookies.pfname;
  const pImage = req.cookies.pImage;
  res.render("nearbyss", { result, pfname, pImage });
});

app.post("/docreg", parseUrl, upload, async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;
    if (password === cpassword) {
      const regdocter = new docter({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        doctertype: req.body.doctertype,
        qualification: req.body.qualification,
        experience: req.body.experience,
        fees: req.body.fees,
        password: req.body.password,
        image: req.file.filename,
        total: "0",
        like: "0",
        dislike: "0",
      });
      const doc = await regdocter.save();

      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(
        "<html><head><title>Account added</title></head><body style=" +
          "background-color: #d5e7f9" +
          "><center><h1 style=" +
          "color: #4535da" +
          ">Doctor has been added successfully</h1></center></body></html>"
      );
      res.end();
    } else {
      res.send("password not matching");
    }
  } catch {
    res.status(400).send("error");
  }
});
// app.listen(port, (req, res) => {
//   console.log(`conected to  port ${port}`);
// });
app.get("/payment", (req, res) => {
  res.render("payment");
});
app.post("/paynow", [parseUrl, parseJson], (req, res) => {
  // Route for making payment

  var paymentDetails = {
    amount: req.cookies.pfees,
    customerId: req.cookies.pfname,
    customerEmail: req.cookies.pemail,
    customerPhone: req.cookies.pphone,
  };
  if (
    !paymentDetails.amount ||
    !paymentDetails.customerId ||
    !paymentDetails.customerEmail ||
    !paymentDetails.customerPhone
  ) {
    res.status(400).send("Payment failed");
  } else {
    var params = {};
    params["MID"] = config.PaytmConfig.mid;
    params["WEBSITE"] = config.PaytmConfig.website;
    params["CHANNEL_ID"] = "WEB";
    params["INDUSTRY_TYPE_ID"] = "Retail";
    params["ORDER_ID"] = "TEST_" + new Date().getTime();
    params["CUST_ID"] = paymentDetails.customerId;
    params["TXN_AMOUNT"] = paymentDetails.amount;
    params["CALLBACK_URL"] = "http://localhost:3000/callback";
    params["EMAIL"] = paymentDetails.customerEmail;
    params["MOBILE_NO"] = paymentDetails.customerPhone;

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        var txn_url =
          "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        res.end();
      }
    );
  }
});
app.post("/callback", async (req, res) => {
  // Route for verifiying payment
  var body = "";

  req.on("data", function (data) {
    body += data;
  });

  req.on("end", async function () {
    console.log("hi");
    const docemail = req.cookies.docemail;
    const pemail = req.cookies.pemail;
    const date = req.cookies.date;
    const Time = req.cookies.Time;
    console.log(pemail, docemail, date, Time);
    var html = "";
    var post_data = qs.parse(body);
    var trans = post_data;
    const appoinments = await appoinment.findOneAndUpdate(
      {
        pemail: pemail,
        docemail: docemail,
        date: date,
        time: Time,
      },
      {
        ORDERID: post_data.ORDERID,
        PAYMENTMODE: post_data.PAYMENTMODE,
      }
    );
    // console.log(trans, "trans", post_data.ORDERID, post_data.PAYMENTMODE);
    // received params in callback
    // console.log("Callback Response: ", post_data, "\n");
    // console.log("bank name" + post_data.BANKNAME);
    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum_lib.verifychecksum(
      post_data,
      config.PaytmConfig.key,
      checksumhash
    );
    // console.log("Checksum Result => ", result, "\n");
    // console.log(result);
    // Send Server-to-Server request to verify Order Status
    var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        params.CHECKSUMHASH = checksum;
        post_data = "JsonData=" + JSON.stringify(params);
        // console.log(post_data);
        var options = {
          hostname: "securegw-stage.paytm.in", // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: "/merchant-status/getTxnStatus",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": post_data.length,
          },
        };

        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            // console.log("S2S Response: ", response, "\n");

            var _result = JSON.parse(response);
            if (_result.STATUS == "TXN_SUCCESS") {
              // res.send("payment sucess");
              console.log(post_data);
              res.writeHead(200, { "Content-Type": "text/html" });
              res.write(
                "<html><head><title>Review send</title><script src=" +
                  "https://code.jquery.com/jquery-3.6.0.min.js" +
                  "></script><script src=" +
                  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.4/jspdf.min.js" +
                  "></script><style>button {border: none;background-color: #4535da;border: 1px solid #4535da;color: white;border-radius: 30px;padding: 10px;}button:hover {border: 1px solid #4535da;color: #4535da;background-color: #FFF}.body{color: #4535da;}.patienttable {width: 50%;margin: auto;padding-top: 50px;background-color: #d5e7f9;border-radius: 30px;}.patienttable th{border: none;padding: 8px;justify-content: center;}patienttable td{border: none;text-align: left;color: #4535da;}</style></head><body style=" +
                  "background-color: #d5e7f9" +
                  "><center><div id=" +
                  "htmlContent" +
                  "><h1>Payment Success</h1><table class=" +
                  "patienttable" +
                  "><tr><th><h3>Oder ID</h3></th><td><h3>" +
                  trans.ORDERID +
                  "</h3></td></tr><tr><th><h3>Amount</h3></th><td><h3>" +
                  trans.TXNAMOUNT +
                  "</h3></td></tr><tr><th><h3>Date and Time</h3></th><td><h3>" +
                  trans.TXNDATE +
                  "</h3></td></tr><tr><th><h3>Payment Mode</h3></th><td><h3>" +
                  trans.PAYMENTMODE +
                  "</h3></td></tr><tr><th><h3>Gateway</h3></th><td><h3>" +
                  trans.GATEWAYNAME +
                  "</h3></td></tr></table></div></center><div id=" +
                  "editor" +
                  "></div><center><p><button id=" +
                  "generatePDF" +
                  ">Generate PDF</button></p><script type=" +
                  "text/javascript" +
                  ">var doc = new jsPDF();var specialElementHandlers = {'#editor': function (element, renderer) {return true;}};$('#generatePDF').click(function () {doc.fromHTML($('#htmlContent').html(), 15, 15, {'width': 700,'elementHandlers': specialElementHandlers});doc.save('sample_file.pdf');});</script></body></html>"
              );
              res.end();
            } else {
              res.send("payment failed");
            }
          });
        });
        // post the data
        post_req.write(post_data);
        post_req.end();
      }
    );
  });
});
app.post("/odermed", [parseUrl, parseJson], (req, res) => {
  // Route for making payment
  // console.log(req.cookies.odermed);
  var paymentDetails = {
    amount: req.cookies.medprice,
    customerId: req.cookies.pfname,
    customerEmail: req.cookies.pemail,
    customerPhone: req.cookies.pphone,
  };
  console.log(paymentDetails);
  if (
    !paymentDetails.amount ||
    !paymentDetails.customerId ||
    !paymentDetails.customerEmail ||
    !paymentDetails.customerPhone
  ) {
    res.status(400).send("Payment failed");
  } else {
    var params = {};
    params["MID"] = config.PaytmConfig.mid;
    params["WEBSITE"] = config.PaytmConfig.website;
    params["CHANNEL_ID"] = "WEB";
    params["INDUSTRY_TYPE_ID"] = "Retail";
    params["ORDER_ID"] = "TEST_" + new Date().getTime();
    params["CUST_ID"] = paymentDetails.customerId;
    params["TXN_AMOUNT"] = paymentDetails.amount;
    params["CALLBACK_URL"] = "http://localhost:3000/callbacks";
    params["EMAIL"] = paymentDetails.customerEmail;
    params["MOBILE_NO"] = paymentDetails.customerPhone;

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        var txn_url =
          "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        res.end();
      }
    );
  }
});
app.post("/callbacks", (req, res) => {
  // Route for verifiying payment

  var body = "";

  req.on("data", function (data) {
    body += data;
  });

  req.on("end", function () {
    var html = "";
    var post_data = qs.parse(body);
    var trans = post_data;
    // const appoinments = await appoinment.find({})
    console.log(trans, "trans");
    // received params in callback
    // console.log("Callback Response: ", post_data, "\n");
    // console.log("bank name" + post_data.BANKNAME);
    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum_lib.verifychecksum(
      post_data,
      config.PaytmConfig.key,
      checksumhash
    );
    // console.log("Checksum Result => ", result, "\n");
    // console.log(result);
    // Send Server-to-Server request to verify Order Status
    var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        params.CHECKSUMHASH = checksum;
        post_data = "JsonData=" + JSON.stringify(params);
        // console.log(post_data);
        var options = {
          hostname: "securegw-stage.paytm.in", // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: "/merchant-status/getTxnStatus",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": post_data.length,
          },
        };

        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            // console.log("S2S Response: ", response, "\n");

            var _result = JSON.parse(response);
            if (_result.STATUS == "TXN_SUCCESS") {
              // res.send("payment sucess");
              console.log(post_data);
              res.writeHead(200, { "Content-Type": "text/html" });
              res.write(
                "<html><head><title>Review send</title><script src=" +
                  "https://code.jquery.com/jquery-3.6.0.min.js" +
                  "></script><script src=" +
                  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.4/jspdf.min.js" +
                  "></script><style>button {border: none;background-color: #4535da;border: 1px solid #4535da;color: white;border-radius: 30px;padding: 10px;}button:hover {border: 1px solid #4535da;color: #4535da;background-color: #FFF}.body{color: #4535da;}.patienttable {width: 50%;margin: auto;padding-top: 50px;background-color: #d5e7f9;border-radius: 30px;}.patienttable th{border: none;padding: 8px;justify-content: center;}patienttable td{border: none;text-align: left;color: #4535da;}</style></head><body style=" +
                  "background-color: #d5e7f9" +
                  "><center><div id=" +
                  "htmlContent" +
                  "><h1>Payment Success</h1><table class=" +
                  "patienttable" +
                  "><tr><th><h3>Oder ID</h3></th><td><h3>" +
                  trans.ORDERID +
                  "</h3></td></tr><tr><th><h3>Amount</h3></th><td><h3>" +
                  trans.TXNAMOUNT +
                  "</h3></td></tr><tr><th><h3>Date and Time</h3></th><td><h3>" +
                  trans.TXNDATE +
                  "</h3></td></tr><tr><th><h3>Payment Mode</h3></th><td><h3>" +
                  trans.PAYMENTMODE +
                  "</h3></td></tr><tr><th><h3>Gateway</h3></th><td><h3>" +
                  trans.GATEWAYNAME +
                  "</h3></td></tr></table></div></center><div id=" +
                  "editor" +
                  "></div><center><p><button id=" +
                  "generatePDF" +
                  ">Generate PDF</button></p><script type=" +
                  "text/javascript" +
                  ">var doc = new jsPDF();var specialElementHandlers = {'#editor': function (element, renderer) {return true;}};$('#generatePDF').click(function () {doc.fromHTML($('#htmlContent').html(), 15, 15, {'width': 700,'elementHandlers': specialElementHandlers});doc.save('sample_file.pdf');});</script></body></html>"
              );
              res.end();
            } else {
              res.send("payment failed");
            }
          });
        });
        // post the data
        post_req.write(post_data);
        post_req.end();
      }
    );
  });
});
// admin pages
app.get("/admindash", async (req, res) => {
  const pat = await patient.find({});
  var ptotal = 0;
  pat.forEach((element) => {
    ptotal += 1;
  });
  const doct = await docter.find({});
  var doctotal = 0;
  doct.forEach((element) => {
    doctotal += 1;
  });
  const appt = await appoinment.find({});
  var apptotal = 0;
  appt.forEach((element) => {
    apptotal += 1;
  });
  const applast = await appoinment.find({}).sort({ _id: -1 }).limit(5);
  res.render("admindash", { ptotal, doctotal, apptotal, applast });
});
app.get("/admindocter", (req, res) => {
  res.render("admindocter");
});
app.get("/admindoctersss", async (req, res) => {
  const docterss = await docter.find({});
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/admindocterGynaecologist", async (req, res) => {
  const docterss = await docter.find({ doctertype: "Gynaecologist" });
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/admindocterPhysician", async (req, res) => {
  const docterss = await docter.find({ doctertype: "Physician" });
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/admindocterDermatologist", async (req, res) => {
  const docterss = await docter.find({
    doctertype: "Dermatologist",
  });
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/admindoctersPsychiatrist", async (req, res) => {
  const docterss = await docter.find({
    doctertype: "Psychiatrist",
  });
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/admindoctersPaediatrician", async (req, res) => {
  const docterss = await docter.find({
    doctertype: "Paediatrician",
  });
  const head = {
    Name: "Name",
    Doctertype: "Doctor type",
    Qualification: "Qualification",
    Experience: "Experience",
    Like: "Like",
  };
  res.render("admindocter", { docterss, head });
});
app.get("/adminpatient", (req, res) => {
  res.render("adminpatient");
});
app.get("/adminpatientrecords", async (req, res) => {
  const patients = await patient.find({});
  const head = {
    Name: "Firstname",
    lname: "Lastname",
    Email: "Email",
    Contactno: "Contact no",
  };
  res.render("adminpatient", { patients, head });
});
app.get("/adminpatienthistory", async (req, res) => {
  const appointments = await appoinment.find({});
  const heads = {
    Name: "Firstname",
    Date: "Date",
    Email: "Email",
    Time: "Time",
  };
  res.render("adminpatient", { appointments, heads });
});
app.get("/adminpatientfeedbcak", async (req, res) => {
  const reviews = await review.find({});
  const headss = {
    docemail: "Doctor Email",
    patientemail: "Patient Email",
    feedback: "Feedback",
  };
  res.render("adminpatient", { reviews, headss });
});
app.get("/adminappoiment", (req, res) => {
  res.render("adminappoiment");
});
app.get("/adminappoimentBooked", async (req, res) => {
  const appointments = await appoinment.find({});
  const head = {
    PName: "Patient name",
    Dname: "Doctor name",
    Date: "Date",
    Time: "Time",
  };
  res.render("adminappoiment", { appointments, head });
});
app.get("/adminappoimentLive", async (req, res) => {
  var date = new Date();
  var day =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  var ctime =
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2);
  const appointments = await appoinment.find({
    date: day,
    time: { $lte: ctime },
    etime: { $gte: ctime },
  });
  const head = {
    PName: "Patient name",
    Dname: "Doctor name",
    Date: "Date",
    Time: "Time",
  };
  res.render("adminappoiment", { appointments, head });
});
app.get("/adminappoimentUpcomming", async (req, res) => {
  var date = new Date();
  var day =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2);
  const appointments = await appoinment.find({
    date: { $gte: day },
    // etime: { $lt: ctime },
  });
  const head = {
    PName: "Patient name",
    Dname: "Doctor name",
    Date: "Date",
    Time: "Time",
  };
  res.render("adminappoiment", { appointments, head });
});
app.get("/adminPayment", async (req, res) => {
  const appointments = await appoinment.find({
    PAYMENTMODE: "DC",
  });
  var DC = 0;
  appointments.forEach((data) => {
    DC += parseInt(data.fees);
  });
  const appointmentb = await appoinment.find({
    PAYMENTMODE: "NB",
  });
  var NB = 0;
  appointmentb.forEach((data) => {
    NB += parseInt(data.fees);
  });
  const head = {
    PName: "Patient name",
    Dname: "Doctor name",
    Date: "Date",
    Time: "Time",
    PAYMENTMODE: "Payment mode",
    Fees: "Fees",
  };
  const appointmentss = await appoinment.find({});
  res.render("adminPayment", { NB, DC, head, appointmentss });
});
app.get("/adminadddocter", (req, res) => {
  res.render("adminadddocter");
});
server.listen(Port, () => console.log(`Server running on port ${Port}`));
