const crypto = require("crypto");
const Platform = require("../models/platform.model");
const Subscription = require("../models/subscription.model");
const DeliveryLog = require("../models/deliveryLog.model");

// Create a new subscription
exports.createSubscription = async (req, res) => {
    try {
        const { platform, callbackUrl, events, secretKey } = req.body;
        const userId = req.user.id;

        if (!platform || !callbackUrl) {
            return res.status(400).json({
                success: false,
                message: "platform and callbackUrl are required",
            });
        }

        if (!/^https?:\/\/.+/.test(callbackUrl)) {
            return res.status(400).json({
                success: false,
                message: "callbackUrl must be a valid HTTP/HTTPS URL",
            });
        }

        const platformDoc = await Platform.findOne({
            name: platform.toLowerCase(),
            isActive: true,
        });

        if (!platformDoc) {
            return res.status(400).json({
                success: false,
                message: `Platform '${platform}' is not supported or inactive`,
            });
        }

        const existingSubscription = await Subscription.findOne({
            user: userId,
            platform: platform.toLowerCase(),
            callbackUrl,
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: "You already have a subscription with this platform and callback URL",
            });
        }

        const generatedSecret =
            secretKey || crypto.randomBytes(32).toString("hex");

        const subscription = await Subscription.create({
            user: userId,
            platform: platform.toLowerCase(),
            callbackUrl,
            events: events || [],
            secretKey: generatedSecret,
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: {
                ...subscription.toObject(),
                webhookUrl: `/api/webhooks/receive/${platform.toLowerCase()}`,
            },
        });
    } catch (error) {
        console.error("[Subscription] Error creating subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create subscription",
        });
    }
};

// Get user's subscriptions
exports.getSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform, active } = req.query;

        const filter = { user: userId };

        if (platform) {
            filter.platform = platform.toLowerCase();
        }

        if (active === "true") {
            filter.isActive = true;
        } else if (active === "false") {
            filter.isActive = false;
        }

        const subscriptions = await Subscription.find(filter)
            .sort({ createdAt: -1 })
            .select("-secretKey");

        return res.status(200).json({
            success: true,
            data: subscriptions,
        });
    } catch (error) {
        console.error("[Subscription] Error fetching subscriptions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscriptions",
        });
    }
};

// Get single subscription by ID
exports.getSubscriptionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId,
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error("[Subscription] Error fetching subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscription",
        });
    }
};

// Update a subscription
exports.updateSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { callbackUrl, events, isActive } = req.body;

        const subscription = await Subscription.findOne({
            _id: id,
            user: userId,
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        if (callbackUrl && !/^https?:\/\/.+/.test(callbackUrl)) {
            return res.status(400).json({
                success: false,
                message: "callbackUrl must be a valid HTTP/HTTPS URL",
            });
        }

        if (callbackUrl) subscription.callbackUrl = callbackUrl;
        if (events) subscription.events = events;
        if (typeof isActive === "boolean") subscription.isActive = isActive;

        await subscription.save();

        return res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
            data: subscription,
        });
    } catch (error) {
        console.error("[Subscription] Error updating subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update subscription",
        });
    }
};

// Delete a subscription
exports.deleteSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const subscription = await Subscription.findOneAndDelete({
            _id: id,
            user: userId,
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subscription deleted successfully",
        });
    } catch (error) {
        console.error("[Subscription] Error deleting subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete subscription",
        });
    }
};

// Get delivery logs
exports.getDeliveryLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subscriptionId, limit = 50, page = 1 } = req.query;

        if (subscriptionId) {
            const subscription = await Subscription.findOne({
                _id: subscriptionId,
                user: userId,
            });

            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found",
                });
            }
        }

        const filter = subscriptionId ? { subscription: subscriptionId } : {};

        if (!subscriptionId) {
            const userSubscriptions = await Subscription.find({
                user: userId,
            }).select("_id");
            filter.subscription = { $in: userSubscriptions.map((s) => s._id) };
        }

        const logs = await DeliveryLog.find(filter)
            .populate("webhookEvent", "platform eventType receivedAt payload")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await DeliveryLog.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("[DeliveryLog] Error fetching logs:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch delivery logs",
        });
    }
};
