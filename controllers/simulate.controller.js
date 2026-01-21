// Simple webhook simulation - sends test webhooks to our API
const http = require("http");

// Sample data for each platform
const sampleData = {
    github: {
        headers: { "x-github-event": "push" },
        body: {
            action: "push",
            repository: { name: "my-repo", full_name: "user/my-repo" },
            sender: { login: "developer" },
        },
    },
    razorpay: {
        headers: {},
        body: {
            event: "payment.captured",
            payload: {
                payment: { id: "pay_123", amount: 50000, currency: "INR" },
            },
        },
    },
    stripe: {
        headers: {},
        body: {
            type: "payment_intent.succeeded",
            data: { object: { id: "pi_123", amount: 2000, currency: "usd" } },
        },
    },
    shopify: {
        headers: { "x-shopify-topic": "orders/create" },
        body: {
            id: 12345,
            email: "customer@example.com",
            total_price: "199.00",
        },
    },
};

// Helper to make HTTP request
function makeRequest(platform, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data.body);
        const options = {
            hostname: "localhost",
            port: process.env.PORT || 6000,
            path: `/api/webhooks/receive/${platform}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
                ...data.headers,
            },
        };

        const req = http.request(options, (res) => {
            let responseData = "";
            res.on("data", (chunk) => (responseData += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch {
                    resolve(responseData);
                }
            });
        });

        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

// Simulate webhook
exports.simulate = async (req, res) => {
    const { platform } = req.params;
    const data = sampleData[platform?.toLowerCase()];

    if (!data) {
        return res.status(400).json({
            success: false,
            message: `Platform '${platform}' not supported`,
            available: Object.keys(sampleData),
        });
    }

    try {
        const result = await makeRequest(platform, data);

        return res.status(200).json({
            success: true,
            message: `Simulated ${platform} webhook sent`,
            sentData: data.body,
            response: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// List available platforms
exports.getOptions = (req, res) => {
    return res.status(200).json({
        success: true,
        platforms: Object.keys(sampleData),
        usage: "POST /api/simulate/:platform",
    });
};
