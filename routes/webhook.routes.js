const express = require("express");
const {
    receiveWebhook,
    getEvents,
    getEventById,
} = require("../controllers/webhook.controller");
const { validateWebhook } = require("../middleware/webhook.middleware");
const { checkAuth } = require("../middleware/user.middleware");

const router = express.Router();

// Public - receive webhooks from external platforms
router.post("/receive/:platform", validateWebhook, receiveWebhook);

// Protected - view events
router.get("/events", checkAuth, getEvents);
router.get("/events/:id", checkAuth, getEventById);

module.exports = router;
