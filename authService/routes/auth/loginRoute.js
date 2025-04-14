const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const {
  generateJWTWithPrivateKey,
  fetchStudents,
  fetchProfessors,
} = require("./util");
const { ROLES } = require("../../../consts");
const { authServiceLogger: logger } = require("../../../logging");
const { getCorrelationId } = require("../../../correlationId");

const router = express.Router();

dotenv.config();

// Student Login
router.post("/student", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      logger.error(`${email} and ${password} does not match`);
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const students = await fetchStudents();

    const student = students.find((s) => s.email === email);
    if (!student) {
      logger.error(`Student -> ${email} not found`);
      return res.status(404).json({ message: "Student not found" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      logger.error(`Password does not match`);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateJWTWithPrivateKey({
      id: student._id,
      roles: [ROLES.STUDENT],
    });
    logger.info(`User with ${email} logged in successfully`);
    res.status(200).json({ access_token: token });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Server error", correlationId: getCorrelationId() });
  }
});

// Professor Login
router.post("/professor", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const professors = await fetchProfessors();

    const professor = professors.find((s) => s.email === email);
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    const isMatch = await bcrypt.compare(password, professor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateJWTWithPrivateKey({
      id: professor._id,
      roles: [ROLES.PROFESSOR],
    });

    res.status(200).json({ access_token: token });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Server error", correlationId: getCorrelationId() });
  }
});

module.exports = router;
