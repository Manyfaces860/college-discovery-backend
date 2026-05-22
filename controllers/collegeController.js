const College = require("../models/College");

// GET /api/colleges — list with search, filter, pagination
const getColleges = async (req, res, next) => {
  try {
    const {
      search = "",
      location,
      minFees,
      maxFees,
      course,
      type,
      page = 1,
      limit = 12,
      sortBy = "rating",
      order = "desc",
    } = req.query;

    const query = {};

    // Full-text search on name
    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Filter: location (city or state)
    if (location && location !== "all") {
      query.$or = [
        { "location.city": { $regex: location, $options: "i" } },
        { "location.state": { $regex: location, $options: "i" } },
      ];
    }

    // Filter: fees range
    if (minFees || maxFees) {
      query.fees = {};
      if (minFees) query.fees.$gte = Number(minFees);
      if (maxFees) query.fees.$lte = Number(maxFees);
    }

    // Filter: course name
    if (course && course !== "all") {
      query["courses.name"] = { $regex: course, $options: "i" };
    }

    // Filter: college type
    if (type && type !== "all") {
      query.type = type;
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (Number(page) - 1) * Number(limit);

    const [colleges, total] = await Promise.all([
      College.find(query)
        .select("name location fees maxFees rating type established nirf_rank image slug accreditation")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      College.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: colleges,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/colleges/:id — single college detail
const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Support both MongoDB _id and slug
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const college = isMongoId
      ? await College.findById(id)
      : await College.findOne({ slug: id });

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }
    res.json({ success: true, data: college });
  } catch (err) {
    next(err);
  }
};

// GET /api/colleges/compare?ids=id1,id2 — compare 2 colleges
const compareColleges = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, message: "Provide ids as comma-separated values" });
    }

    const idList = ids.split(",").map((s) => s.trim()).slice(0, 2);
    if (idList.length < 2) {
      return res.status(400).json({ success: false, message: "Provide exactly 2 college ids" });
    }

    const colleges = await Promise.all(
      idList.map((id) => {
        const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
        return isMongoId
          ? College.findById(id)
          : College.findOne({ slug: id });
      })
    );

    const missing = colleges.findIndex((c) => !c);
    if (missing !== -1) {
      return res.status(404).json({ success: false, message: `College ${idList[missing]} not found` });
    }

    res.json({ success: true, data: colleges });
  } catch (err) {
    next(err);
  }
};

// GET /api/colleges/filters/meta — distinct filter options
const getFilterMeta = async (req, res, next) => {
  try {
    const [locations, types, courseNames] = await Promise.all([
      College.distinct("location.state"),
      College.distinct("type"),
      College.distinct("courses.name"),
    ]);

    res.json({
      success: true,
      data: {
        locations: locations.sort(),
        types,
        courses: courseNames.sort(),
        feeRanges: [
          { label: "Under ₹1L", min: 0, max: 100000 },
          { label: "₹1L – ₹3L", min: 100000, max: 300000 },
          { label: "₹3L – ₹10L", min: 300000, max: 1000000 },
          { label: "Above ₹10L", min: 1000000, max: 9999999 },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getColleges, getCollegeById, compareColleges, getFilterMeta };