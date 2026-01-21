const crypto = require("crypto");

// Validate webhook signature based on platform
exports.validateWebhook = (req, res, next) => {
    const platform = req.params.platform?.toLowerCase();
    let isValid = false;

    switch (platform) {
        case "github":
            isValid = validateGitHub(req);
            break;
        case "razorpay":
            isValid = validateRazorpay(req);
            break;
        case "stripe":
            isValid = validateStripe(req);
            break;
        case "shopify":
            isValid = validateShopify(req);
            break;
        default:
            // For unknown platforms, skip validation
            isValid = true;
    }

    req.webhookValidated = isValid;
    next();
};

// GitHub signature validation (HMAC-SHA256 with 'sha256=' prefix)
function validateGitHub(req) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) return true; // Skip if no secret configured

    const signature = req.headers["x-hub-signature-256"];
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const expectedSignature =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(payload).digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Razorpay signature validation (HMAC-SHA256)
function validateRazorpay(req) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return true; // Skip if no secret configured

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Stripe signature validation
function validateStripe(req) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return true; // Skip if no secret configured

    const signature = req.headers["stripe-signature"];
    if (!signature) return false;

    // Parse Stripe signature header (t=timestamp,v1=signature)
    const elements = signature.split(",");
    const signatureHash = elements
        .find((e) => e.startsWith("v1="))
        ?.replace("v1=", "");
    const timestamp = elements
        .find((e) => e.startsWith("t="))
        ?.replace("t=", "");

    if (!signatureHash || !timestamp) return false;

    const payload = `${timestamp}.${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signatureHash),
        Buffer.from(expectedSignature)
    );
}

// Shopify signature validation (Base64 HMAC-SHA256)
function validateShopify(req) {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) return true; // Skip if no secret configured

    const signature = req.headers["x-shopify-hmac-sha256"];
    if (!signature) return false;

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
