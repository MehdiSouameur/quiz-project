import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

// In-memory store of tokens (MVP purposes)
const validTokens: string[] = [];

// Generate a random token
function generateAuth(): string {
  return crypto.randomBytes(16).toString("hex"); // 32-character hex string
}

// Basic authentication check
router.get("/check", (req: Request, res: Response) => {
    const token = req.cookies?.token;
    console.log(token);
    if (!token || !validTokens.includes(token)) {
        return res.json({ authenticated: false });
    }

    return res.json({ authenticated: true });
});

// Register a new token
router.post("/register", (req: Request, res: Response) =>  {
    console.log("Register request received");
    const newToken = generateAuth();
    validTokens.push(newToken);

    const randomNumber = Math.floor(100 + Math.random() * 900); // 100–999
    const username = `guest-${randomNumber}`;

    // Optionally, set as cookie
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", newToken, {
    httpOnly: false,                 // or true if you don't need JS access
    sameSite: isProd ? "none" : "lax",
    secure: isProd,                  // must be true on HTTPS (Render)
    });

    res.cookie("username", username, {
    httpOnly: false,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    });

    return res.json({ token: newToken });
});

export default router;
