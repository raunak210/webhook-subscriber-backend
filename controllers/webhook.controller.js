const crypto = require("crypto");
const Platform = require("../models/platform.model");
const Subscription = require("../models/subscription.model");
const WebhookEvent = require("../models/webhookEvent.model");
const DeliveryLog = require("../models/deliveryLog.model");

// Forward webhook to subscribers (async helper)
async function forwardWebhookToSubscribers(webhookEvent, platformName, eventType) {
    try {
        const subscriptions = await Subscription.find({
            platform: platformName,
            isActive: true,
        });

        if (subscriptions.length === 0) {
            console.log(`[Forward] No active subscriptions for ${platformName}`);
            return;
        }

        console.log(
            `[Forward] Forwarding to ${subscriptions.length} subscriber(s) for ${platformName}:${eventType}`
        );

        for (const subscription of subscriptions) {
            if (
                subscription.events.length > 0 &&
                !subscription.events.includes(eventType)
            ) {
                console.log(
                    `[Forward] Skipping ${subscription.callbackUrl} - event not in filter`
                );
                continue;
            }

            const deliveryLog = await DeliveryLog.create({
                subscription: subscription._id,
                webhookEvent: webhookEvent._id,
                status: "pending",
            });

            try {
                const payload = JSON.stringify({
                    event: eventType,
                    platform: platformName,
                    data: webhookEvent.payload,
                    timestamp: new Date().toISOString(),
                    webhookEventId: webhookEvent._id,
                });

                const signature = crypto
                    .createHmac("sha256", subscription.secretKey)
                    .update(payload)
                    .digest("hex");

                const response = await fetch(subscription.callbackUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Webhook-Signature": signature,
                        "X-Webhook-Platform": platformName,
                        "X-Webhook-Event": eventType,
                    },
                    body: payload,
                });

                const responseText = await response.text();

                deliveryLog.status = response.ok ? "success" : "failed";
                deliveryLog.statusCode = response.status;
                deliveryLog.responseBody = responseText.substring(0, 1000);
                deliveryLog.deliveredAt = new Date();
                await deliveryLog.save();

                subscription.lastTriggeredAt = new Date();
                subscription.triggerCount += 1;
                if (!response.ok) {
                    subscription.failureCount += 1;
                }
                await subscription.save();

                console.log(
                    `[Forward] ${response.ok ? "✓" : "✗"} ${subscription.callbackUrl} - Status: ${response.status}`
                );
            } catch (fetchError) {
                deliveryLog.status = "failed";
                deliveryLog.errorMessage = fetchError.message;
                await deliveryLog.save();

                subscription.failureCount += 1;
                await subscription.save();

                console.error(
                    `[Forward] Error forwarding to ${subscription.callbackUrl}:`,
                    fetchError.message
                );
            }
        }
    } catch (error) {
        console.error("[Forward] Error in forwardWebhookToSubscribers:", error);
    }
}

// Receive webhook from external platform
exports.receiveWebhook = async (req, res) => {
    const platformName = req.params.platform?.toLowerCase() || "unknown";

    try {
        const platform = await Platform.findOne({
            name: platformName,
            isActive: true,
        });

        if (!platform) {
            console.log(
                `[Webhook] Unknown or inactive platform: ${platformName}`
            );
        }

        let eventType;

        switch (platformName) {
            case "github":
                eventType = req.headers["x-github-event"] || "unknown";
                break;
            case "razorpay":
                eventType = req.body?.event || "unknown";
                break;
            case "stripe":
                eventType = req.body?.type || "unknown";
                break;
            case "shopify":
                eventType = req.headers["x-shopify-topic"] || "unknown";
                break;
            default:
                if (platform?.eventHeader) {
                    eventType =
                        req.headers[platform.eventHeader.toLowerCase()] ||
                        "unknown";
                } else {
                    eventType =
                        req.body?.event || req.body?.type || "unknown";
                }
        }

        const webhookEvent = await WebhookEvent.create({
            platform: platformName,
            eventType,
            payload: req.body,
            headers: req.headers,
            validated: req.webhookValidated || false,
            receivedAt: new Date(),
        });

        console.log(
            `[Webhook] Received ${platformName}:${eventType} - ID: ${webhookEvent._id}`
        );

        // Forward asynchronously
        setImmediate(() => {
            forwardWebhookToSubscribers(webhookEvent, platformName, eventType);
        });

        return res.status(200).json({
            success: true,
            message: "Webhook received",
            id: webhookEvent._id,
        });
    } catch (error) {
        console.error("[Webhook] Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process webhook",
        });
    }
};

// Get webhook events
exports.getEvents = async (req, res) => {
    try {
        const { platform, limit = 50, page = 1 } = req.query;

        const filter = {};
        if (platform) {
            filter.platform = platform.toLowerCase();
        }

        const events = await WebhookEvent.find(filter)
            .sort({ receivedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await WebhookEvent.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: events,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("[Webhook] Error fetching events:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch webhook events",
        });
    }
};

// Get single webhook event
exports.getEventById = async (req, res) => {
    try {
        const event = await WebhookEvent.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Webhook event not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        console.error("[Webhook] Error fetching event:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch webhook event",
        });
    }
};
