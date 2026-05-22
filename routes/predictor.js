const express = require("express");
const router = express.Router();
const { predictColleges, getSupportedExams } = require("../controllers/predictorController");

// GET /api/predictor/exams
router.get("/exams", getSupportedExams);

// POST /api/predictor
router.post("/", predictColleges);

module.exports = router;