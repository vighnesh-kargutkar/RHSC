const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  });
  console.log("connected to RHSC Docter");
}

const reviewschemaa = new mongoose.Schema({
  docteremail: {
    type: String,
    required: true,
  },
  patientemail: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
});

// create a collection

const review = new mongoose.model("review", reviewschemaa);
module.exports = review;
