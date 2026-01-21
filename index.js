const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth.routes");
const platformRoutes = require("./routes/platform.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const webhookRoutes = require("./routes/webhook.routes");
const simulateRoutes = require("./routes/simulate.routes");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

console.log("index.js");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/simulate", simulateRoutes);

// Start server
app.listen(PORT, () => {
    process.env.MONGO_URI
        ? mongoose.connect(process.env.MONGO_URI).then(() => {
            console.log(
                `MongoDB connected. App listening on port ${PORT}`
            );
        })
        : console.log("MONGO_URI is not defined");
});