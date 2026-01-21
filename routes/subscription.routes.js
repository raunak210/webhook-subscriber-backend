const express = require("express");
const {
    createSubscription,
    getSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
    getDeliveryLogs,
} = require("../controllers/subscription.controller");
const { checkAuth } = require("../middleware/user.middleware");

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

router.post("/", createSubscription);
router.get("/", getSubscriptions);
router.get("/logs", getDeliveryLogs);
router.get("/:id", getSubscriptionById);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

module.exports = router;
