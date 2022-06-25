const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  });
  console.log("connected to RHSC disease");
}

const diseaseSchema = new mongoose.Schema({
  name: String,
  overview: String,
  type: String,
  symptoms: String,
  Causes: String,
  Riskfactors: String,
  Prevention: String,
  Diagnosis: String,
  Treatment: String,
  Alternativemedicine: String,
});
const disease = new mongoose.model("disease", diseaseSchema);
module.exports = disease;
