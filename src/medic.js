const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  });
  console.log("connected to RHSC medicine");
}

const medSchema = new mongoose.Schema({
  name: String,
  drugname: String,
  description: String,
  alergies: String,
  pediatric: String,
  geriatric: String,
  breastfeeding: String,
  druginteraction: String,
  otherinteraction: String,
  othermedicineproblem: String,
  properuse: String,
  dosing: String,
  misseddose: String,
  storage: String,
  precaution: String,
  sideeffect: String,
});
const medicine = new mongoose.model("medicine", medSchema);
module.exports = medicine;
