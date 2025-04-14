const express = require("express");

const Enrollment = require("../models/enrollment");
const { enrollementServiceLogger: logger } = require("../../logging");

const router = express.Router();

const {
  verifyRole,
  restrictStudentToOwnData,
  fetchStudents,
  fetchCourses,
} = require("./auth/util");
const { ROLES } = require("../../consts");
const { getCorrelationId } = require("../../correlationId");

// Create a new enrollment
router.post(
  "/",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const { student, course } = req.body;

      // Ensure both student and course IDs are provided
      if (!student || !course) {
        logger.error(
          "Student and Course are required to create a new enrollement"
        );
        return res
          .status(400)
          .json({ message: "Student and Course are required" });
      }

      const students = await fetchStudents();
      const existingStudent = students.find((s) => s._id === student);
      if (!existingStudent) {
        logger.error("Student not found to create enrollement");
        return res.status(404).json({ message: "Student not found" });
      }

      const courses = await fetchCourses();
      const existingCourse = courses.find((c) => c._id === course);
      if (!existingCourse) {
        logger.error("Course not found to create enrollement");
        return res.status(404).json({ message: "Course not found" });
      }

      // Attempt to create the Enrollment
      const enrollment = new Enrollment({ student, course });
      await enrollment.save();

      res.status(201).json(enrollment);
    } catch (error) {
      console.log(error);
      // Handle duplicate enrollment error
      if (error.code === 11000) {
        logger.error(
          "Duplicate enrollment: Student is already enrolled in this course"
        );
        return res.status(409).json({
          message:
            "Duplicate enrollment: Student is already enrolled in this course.",
        });
      }
      logger.error(error);
      res.status(500).json({
        message: "Server Error: Unable to create enrollment",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// Get all enrollments
router.get(
  "/",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find();
      res.status(200).json(enrollments);
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// Get a specific enrollment by ID
router.get(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const enrollment = await Enrollment.findById(req.params.id)
        .populate("student", "name email")
        .populate("course", "name code description");

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      res.status(200).json(enrollment);
    } catch (error) {
      logger.error(error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ message: "Invalid enrollment ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollment",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// Get enrollment by student ID
router.get(
  "/student/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]),
  restrictStudentToOwnData,
  async (req, res) => {
    try {
      let enrollments = await Enrollment.find({
        student: req.params.id,
      });

      if (!enrollments.length) {
        logger.info("No enrollments found for this student");
        return res
          .status(404)
          .json({ message: "No enrollments found for this student" });
      }

      const courses = await fetchCourses();
      enrollments = enrollments.map((enrollment) => {
        const enrollmentObj = enrollment.toObject(); // Convert to plain object if it's a Mongoose document
        const course = courses.find(
          (course) => course._id.toString() === enrollmentObj.course.toString()
        );
        if (course) {
          enrollmentObj.course = course; // Replace course ID with the full course object
        }
        return enrollmentObj;
      });

      res.status(200).json(enrollments);
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments for student",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// Get enrollment by course ID
router.get(
  "/course/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.find({ course: req.params.id })
        .populate("student", "name email")
        .populate("course", "name code description");

      if (!enrollments.length) {
        return res
          .status(404)
          .json({ message: "No enrollments found for this course" });
      }

      res.status(200).json(enrollments);
    } catch (error) {
      logger.error(error);
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments for course",
        correlationId: getCorrelationId(),
      });
    }
  }
);

// Delete an enrollment by ID
router.delete(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      res
        .status(200)
        .json({ message: "Enrollment deleted successfully", enrollment });
    } catch (error) {
      logger.error(error);

      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ message: "Invalid enrollment ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to delete enrollment",
        correlationId: getCorrelationId(),
      });
    }
  }
);

module.exports = router;
