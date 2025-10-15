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
    const newToken = generateAuth();
    validTokens.push(newToken);

    const randomNumber = Math.floor(100 + Math.random() * 900); // 100–999
    const username = `guest-${randomNumber}`;

    // Optionally, set as cookie
    res.cookie("token", newToken, {
        httpOnly: true,
        sameSite: "lax", // adjust for your frontend
        secure: false, 
    });

    res.cookie("username", username, {
        httpOnly: false,
        sameSite: "lax",
        secure: false,
    });

    return res.json({ token: newToken });
});

export default router;
