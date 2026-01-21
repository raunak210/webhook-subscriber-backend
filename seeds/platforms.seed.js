const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Platform = require("../models/platform.model");

dotenv.config();

const defaultPlatforms = [
    {
        name: "github",
        displayName: "GitHub",
        signatureHeader: "x-hub-signature-256",
        eventHeader: "x-github-event",
        docsUrl: "https://docs.github.com/en/webhooks",
        isActive: true,
    },
    {
        name: "razorpay",
        displayName: "Razorpay",
        signatureHeader: "x-razorpay-signature",
        eventHeader: null,
        docsUrl: "https://razorpay.com/docs/webhooks/",
        isActive: true,
    },
    {
        name: "stripe",
        displayName: "Stripe",
        signatureHeader: "stripe-signature",
        eventHeader: null,
        docsUrl: "https://stripe.com/docs/webhooks",
        isActive: true,
    },
    {
        name: "shopify",
        displayName: "Shopify",
        signatureHeader: "x-shopify-hmac-sha256",
        eventHeader: "x-shopify-topic",
        docsUrl: "https://shopify.dev/docs/apps/webhooks",
        isActive: true,
    },
];

async function seedPlatforms() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        for (const platform of defaultPlatforms) {
            const existing = await Platform.findOne({ name: platform.name });
            if (!existing) {
                await Platform.create(platform);
                console.log(`Created platform: ${platform.displayName}`);
            } else {
                console.log(`Platform already exists: ${platform.displayName}`);
            }
        }

        console.log("Seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedPlatforms();
