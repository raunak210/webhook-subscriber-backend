const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        platform: {
            type: String,
            required: true,
            lowercase: true,
        },
        callbackUrl: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: "callbackUrl must be a valid URL",
            },
        },
        events: [{ type: String }],
        secretKey: { type: String },
        isActive: { type: Boolean, default: true },
        lastTriggeredAt: { type: Date },
        triggerCount: { type: Number, default: 0 },
        failureCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Prevent duplicate subscriptions
subscriptionSchema.index(
    { user: 1, platform: 1, callbackUrl: 1 },
    { unique: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
