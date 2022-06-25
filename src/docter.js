const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  });
  console.log("connected to RHSC Docter");
}

const docschemaa = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  doctertype: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  fees: {
    type: Number,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  total: {
    type: Number,
  },
  like: {
    type: Number,
  },
  dislike: {
    type: Number,
  },
});
docschemaa.pre("save", async function (next) {
  if (this.isModified("password")) {
    console.log(`the current password is ${this.password}`);
    this.password = await bcrypt.hash(this.password, 10);
    console.log(`the current password is ${this.password}`);
  }
  next();
});

// create a collection

const docter = new mongoose.model("docter", docschemaa);
module.exports = docter;
