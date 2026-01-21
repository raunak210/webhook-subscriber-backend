const jwt = require("jsonwebtoken");

exports.checkAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"]; // Use lowercase here

    console.log("Authorization Header:", authHeader);

    const token =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split("Bearer ")[1]
            : null;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token not found" });
    }

    console.log("Token:", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        const user = { id: decoded.id };
        req.user = user;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ message: "Unauthorized: Token verification failed", error });
    }
};