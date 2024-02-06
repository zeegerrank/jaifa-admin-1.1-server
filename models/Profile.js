const mongoose = require("mongoose");const profileSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    address: String,
    phoneNumber: Number,
    birthDate: Date,
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", profileSchema);
module.exports = Profile;
