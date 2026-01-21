const express = require("express");
const { simulate, getOptions } = require("../controllers/simulate.controller");

const router = express.Router();

// GET /api/simulate - list available platforms
router.get("/", getOptions);

// POST /api/simulate/:platform - simulate a webhook
router.post("/:platform", simulate);

module.exports = router;
