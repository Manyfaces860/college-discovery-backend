const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
  batch: { type: String },
});

const placementSchema = new mongoose.Schema({
  averagePackage: { type: Number }, // in LPA
  highestPackage: { type: Number }, // in LPA
  placementRate: { type: Number },  // percentage 0-100
  topRecruiters: [{ type: String }],
  year: { type: Number, default: new Date().getFullYear() },
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String },        // e.g. "4 years"
  fees: { type: Number },            // annual fees in INR
  seats: { type: Number },
  type: {
    type: String,
    enum: ["UG", "PG", "PhD", "Diploma"],
    default: "UG",
  },
});

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true, index: true },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
    },
    fees: { type: Number, required: true },       // min annual fees in INR
    maxFees: { type: Number },                    // max annual fees
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["IIT", "NIT", "IIIT", "Government", "Private", "Deemed"],
      required: true,
    },
    established: { type: Number },
    description: { type: String },
    website: { type: String },
    nirf_rank: { type: Number },
    accreditation: { type: String },              // NAAC grade
    courses: [courseSchema],
    placements: placementSchema,
    reviews: [reviewSchema],
    image: { type: String },
    // For predictor: rank cutoffs per exam
    cutoffs: [
      {
        exam: {
          type: String,
          enum: ["JEE Main", "JEE Advanced", "GATE", "CAT", "NEET", "State CET"],
        },
        category: {
          type: String,
          enum: ["General", "OBC", "SC", "ST", "EWS"],
          default: "General",
        },
        rankMin: { type: Number },
        rankMax: { type: Number },
        course: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Text index for search
collegeSchema.index({ name: "text", "location.city": "text", "location.state": "text" });

// Auto-generate slug from name before saving
collegeSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

module.exports = mongoose.model("College", collegeSchema);