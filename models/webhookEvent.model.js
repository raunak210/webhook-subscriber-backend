const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
    {
        platform: { type: String, required: true },
        eventType: { type: String, required: true },
        payload: { type: Object, required: true },
        headers: { type: Object },
        validated: { type: Boolean, default: false },
        receivedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
