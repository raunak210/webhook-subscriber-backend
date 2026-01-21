const express = require("express");
const { login, signup, checkAuth } = require("../controllers/auth.controller");
const { checkAuth: verifyToken } = require("../middleware/user.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/check", verifyToken, checkAuth);

module.exports = router;