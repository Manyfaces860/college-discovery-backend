const College = require("../models/College");

// POST /api/predictor — predict colleges based on exam + rank
const predictColleges = async (req, res, next) => {
  try {
    const { exam, rank, category = "General" } = req.body;

    if (!exam || !rank) {
      return res.status(400).json({ success: false, message: "exam and rank are required" });
    }

    const rankNum = Number(rank);
    if (isNaN(rankNum) || rankNum < 1) {
      return res.status(400).json({ success: false, message: "rank must be a positive number" });
    }

    // Find colleges where cutoff matches the exam and the rank falls within range
    const colleges = await College.find({
      cutoffs: {
        $elemMatch: {
          exam: exam,
          category: category,
          rankMin: { $lte: rankNum },
          rankMax: { $gte: rankNum },
        },
      },
    })
      .select("name location fees rating type slug image nirf_rank cutoffs placements")
      .sort({ "placements.placementRate": -1, rating: -1 })
      .limit(20);

    // Attach the matching cutoff entry to each result for display
    const results = colleges.map((college) => {
      const matchingCutoffs = college.cutoffs.filter(
        (c) => c.exam === exam && c.category === category && c.rankMin <= rankNum && c.rankMax >= rankNum
      );
      return {
        _id: college._id,
        slug: college.slug,
        name: college.name,
        location: college.location,
        fees: college.fees,
        rating: college.rating,
        type: college.type,
        image: college.image,
        nirf_rank: college.nirf_rank,
        placements: college.placements,
        matchingCourses: matchingCutoffs.map((c) => c.course).filter(Boolean),
        admissionChance: getAdmissionChance(rankNum, matchingCutoffs),
      };
    });

    res.json({
      success: true,
      data: results,
      meta: { exam, rank: rankNum, category, totalFound: results.length },
    });
  } catch (err) {
    next(err);
  }
};

// Helper: determine chance based on rank position within cutoff window
function getAdmissionChance(rank, cutoffs) {
  if (!cutoffs.length) return "Low";
  const cutoff = cutoffs[0];
  const range = cutoff.rankMax - cutoff.rankMin;
  if (range === 0) return "High";
  const position = (rank - cutoff.rankMin) / range;
  if (position <= 0.33) return "High";
  if (position <= 0.66) return "Medium";
  return "Low";
}

// GET /api/predictor/exams — list of supported exams
const getSupportedExams = async (req, res, next) => {
  try {
    const exams = await College.distinct("cutoffs.exam");
    res.json({ success: true, data: exams.sort() });
  } catch (err) {
    next(err);
  }
};

module.exports = { predictColleges, getSupportedExams };