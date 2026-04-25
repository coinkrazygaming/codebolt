import express, { Request, Response } from "express";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sendError,
  sendSuccess,
} from "../auth";
import { authenticateRequest } from "../middleware";
import prisma from "../db";

const router = express.Router();

// Sign up
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    if (password.length < 6) {
      sendError(res, 400, "Password must be at least 6 characters");
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 400, "Email already registered");
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create default space
    await prisma.space.create({
      data: {
        userId: user.id,
        name: "My Workspace",
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email, name: user.name },
        token,
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    sendError(res, 500, "Failed to create account");
  }
});

// Login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      sendError(res, 400, "Email and password are required");
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Compare password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      sendError(res, 401, "Invalid email or password");
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    sendSuccess(res, {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, 500, "Failed to login");
  }
});

// Logout
router.post(
  "/logout",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await prisma.session.deleteMany({
          where: { token },
        });
      }

      sendSuccess(res, { message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      sendError(res, 500, "Failed to logout");
    }
  }
);

// Get current user
router.get(
  "/me",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      if (!user) {
        sendError(res, 404, "User not found");
        return;
      }

      sendSuccess(res, { user });
    } catch (error) {
      console.error("Get user error:", error);
      sendError(res, 500, "Failed to fetch user");
    }
  }
);

export default router;
