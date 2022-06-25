const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://localhost:27017/RHSC", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  console.log("connected to RHSC location ");
}
const paientSchema = new mongoose.Schema({
  name: String,
  address: String,
  location: {
    type: { type: String },
    coordinates: [],
  },
});
paientSchema.index({ location: "2dsphere" });
const marker = new mongoose.model("marker", paientSchema);
module.exports = marker;
