const express = require("express");
const {
    getPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
} = require("../controllers/platform.controller");
const { checkAuth } = require("../middleware/user.middleware");

const router = express.Router();

// Public
router.get("/", getPlatforms);

// Protected
router.post("/", checkAuth, createPlatform);
router.put("/:id", checkAuth, updatePlatform);
router.delete("/:id", checkAuth, deletePlatform);

module.exports = router;
