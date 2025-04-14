const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the Student Schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Ensures email is stored in lowercase
    // match: [/.+@.+\..+/, "Please provide a valid email address"], // Email validation regex
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Ensures a minimum password length
  },
});

// Pre-save hook to hash the password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if the password is new/changed

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare provided password with the stored hashed password
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Create the Student model
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
