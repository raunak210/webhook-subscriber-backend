const Platform = require("../models/platform.model");

// Get all supported platforms
exports.getPlatforms = async (req, res) => {
    try {
        const { active } = req.query;
        const filter = {};

        if (active === "true") {
            filter.isActive = true;
        }

        const platforms = await Platform.find(filter).sort({ displayName: 1 });

        return res.status(200).json({
            success: true,
            data: platforms,
        });
    } catch (error) {
        console.error("[Platform] Error fetching platforms:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch platforms",
        });
    }
};

// Create a new platform
exports.createPlatform = async (req, res) => {
    try {
        const { name, displayName, signatureHeader, eventHeader, docsUrl } =
            req.body;

        if (!name || !displayName) {
            return res.status(400).json({
                success: false,
                message: "name and displayName are required",
            });
        }

        const existingPlatform = await Platform.findOne({
            name: name.toLowerCase(),
        });
        if (existingPlatform) {
            return res.status(400).json({
                success: false,
                message: "Platform already exists",
            });
        }

        const platform = await Platform.create({
            name: name.toLowerCase(),
            displayName,
            signatureHeader,
            eventHeader,
            docsUrl,
        });

        return res.status(201).json({
            success: true,
            message: "Platform created successfully",
            data: platform,
        });
    } catch (error) {
        console.error("[Platform] Error creating platform:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create platform",
        });
    }
};

// Update a platform
exports.updatePlatform = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const platform = await Platform.findByIdAndUpdate(id, updates, {
            new: true,
        });

        if (!platform) {
            return res.status(404).json({
                success: false,
                message: "Platform not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Platform updated successfully",
            data: platform,
        });
    } catch (error) {
        console.error("[Platform] Error updating platform:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update platform",
        });
    }
};

// Delete a platform
exports.deletePlatform = async (req, res) => {
    try {
        const { id } = req.params;

        const platform = await Platform.findByIdAndDelete(id);

        if (!platform) {
            return res.status(404).json({
                success: false,
                message: "Platform not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Platform deleted successfully",
        });
    } catch (error) {
        console.error("[Platform] Error deleting platform:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete platform",
        });
    }
};
