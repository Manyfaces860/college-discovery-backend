const express = require("express");
const router = express.Router();
const {
  getColleges,
  getCollegeById,
  compareColleges,
  getFilterMeta,
} = require("../controllers/collegeController");

// GET /api/colleges/filters/meta — must be before /:id to avoid conflict
router.get("/filters/meta", getFilterMeta);

// GET /api/colleges/compare?ids=id1,id2
router.get("/compare", compareColleges);

// GET /api/colleges
router.get("/", getColleges);

// GET /api/colleges/:id (supports both _id and slug)
router.get("/:id", getCollegeById);

module.exports = router;