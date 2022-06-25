const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  });
  console.log("connected to RHSC Appoinments");
}

const docschemaa = new mongoose.Schema({
  docfname: {
    type: String,
    required: true,
  },
  doclname: {
    type: String,
    required: true,
  },
  docemail: {
    type: String,
    required: true,
  },
  pemail: {
    type: String,
    required: true,
  },
  pfname: {
    type: String,
    required: true,
  },
  plname: {
    type: String,
    required: true,
  },
  pphone: {
    type: Number,
    required: true,
  },
  fees: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  etime: {
    type: String,
    required: true,
  },
  doctertype: {
    type: String,
  },
  date: {
    type: String,
    required: true,
  },
  eprescription: {
    type: String,
  },
  medprice: {
    type: Number,
  },
  ORDERID: {
    type: String,
  },
  PAYMENTMODE: {
    type: String,
  },
});

// create a collection

const appoinment = new mongoose.model("appoinment", docschemaa);
module.exports = appoinment;
