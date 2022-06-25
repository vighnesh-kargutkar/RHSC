var nodemailer = require("nodemailer");
const appoinment = require("./appbook");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rhscappointment@gmail.com",
    pass: "RHSC@123",
  },
});
var date = new Date();
var day =
  date.getFullYear() +
  "-" +
  ("0" + (date.getMonth() + 1)).slice(-2) +
  "-" +
  ("0" + date.getDate()).slice(-2);
var ctime =
  ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
console.log(ctime);
console.log(day);
async function checkappointment(params) {
  const checkapp = await appoinment.find({
    date: day,
    time: { $gte: ctime },
  });
  if (checkapp != null) {
    checkapp.forEach((data) => {
      //   console.log(data);
      var mailOptions = {
        from: "rhscappointment@gmail.com",
        to: `${data.pemail}`,
        subject: "Appointment Today",
        text: `You have an appointment today for Dr.${data.docfname}${data.doclname} on date ${data.date} ${data.time}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      transporter.close();
    });
  }
}
checkappointment();
