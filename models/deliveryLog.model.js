const mongoose = require("mongoose");

const deliveryLogSchema = new mongoose.Schema(
    {
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            required: true,
        },
        webhookEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WebhookEvent",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
        },
        statusCode: { type: Number },
        responseBody: { type: String },
        errorMessage: { type: String },
        deliveredAt: { type: Date },
        retryCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("DeliveryLog", deliveryLogSchema);
