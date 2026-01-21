const mongoose = require("mongoose");

const platformSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, lowercase: true },
        displayName: { type: String, required: true },
        signatureHeader: { type: String },
        eventHeader: { type: String },
        docsUrl: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Platform", platformSchema);
