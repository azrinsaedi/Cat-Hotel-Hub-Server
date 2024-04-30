import mongoose from "mongoose";
const CompanySchema = new mongoose.Schema(
  { name: String },
  { timestamps: true }
);
export default mongoose.model("Company", CompanySchema);
