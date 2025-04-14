const express = require("express");

const Student = require("../models/student");
const { studentServiceLogger: logger } = require("../../logging");

const {
  verifyRole,
  restrictStudentToOwnData,
  jwtRateLimiter,
} = require("./auth/util");
const { ROLES } = require("../../consts");
const { getCorrelationId } = require("../../correlationId");

const router = express.Router();

// GET all students
router.get(
  "/",
  verifyRole([
    ROLES.PROFESSOR,
    ROLES.ADMIN,
    ROLES.AUTH_SERVICE,
    ROLES.ENROLLMENT_SERVICE,
  ]),
  jwtRateLimiter,
  async (req, res) => {
    try {
      if (
        req.user.id === ROLES.AUTH_SERVICE &&
        req.user.roles.includes(ROLES.AUTH_SERVICE)
      ) {
        const students = await Student.find();
        logger.info("Student Fetched using auth Service");
        return res.json(students);
      }
      logger.info("All Students Fetched");
      const students = await Student.find().select("-password");
      return res.json(students);
    } catch (error) {
      logger.info(error);
      res.status(500).json({
        message: "Server Error: Unable to fetch students",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// GET a single student by ID
router.get(
  "/:id",
  verifyRole([ROLES.PROFESSOR, ROLES.STUDENT, ROLES.ADMIN]),
  restrictStudentToOwnData,
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      if (error.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to fetch student",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// POST a new student
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email, and password" });
  }

  try {
    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this email already exists" });
    }

    const newStudent = new Student({ name, email, password });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({
      message: "Server Error: Unable to create student",
      correlationId: getCorrelationId(),
    });
  }
});

// PUT update an existing student by ID
router.put(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]),
  restrictStudentToOwnData,
  async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name and password" });
    }

    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Prevent email updates
      student.name = name;
      student.password = password;

      const updatedStudent = await student.save();
      res.json(updatedStudent);
    } catch (error) {
      if (error.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to update student",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// DELETE a student by ID
router.delete(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]),
  restrictStudentToOwnData,
  async (req, res) => {
    try {
      const { deleteEnrollments, deleteGrades } = req.query;
      const studentId = req.params.id; // Get the student ID from the route parameter

      // Attempt to delete the student
      const student = await Student.findByIdAndDelete(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      // if (deleteEnrollments) {
      //   await Enrollment.deleteMany({ student: studentId });
      // }
      // if (deleteGrades) {
      //   await Grade.deleteMany({ student: studentId });
      // }

      // Respond with success message
      res.json({ message: "Student removed successfully", student });
    } catch (error) {
      // Handle invalid ObjectId format
      if (error.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      // Handle other server errors
      res.status(500).json({
        message: "Server Error: Unable to delete student",
        correlationId: getCorrelationId(),
      });
    }
  }
);

module.exports = router;
