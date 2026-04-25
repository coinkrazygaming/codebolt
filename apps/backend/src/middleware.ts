import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken } from "./auth";
import prisma from "./db";

function sendError(res: Response, statusCode: number, message: string): void {
  res.status(statusCode).json({ error: message });
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      sendError(res, 401, "Missing or invalid authorization header");
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      sendError(res, 401, "Invalid or expired token");
      return;
    }

    // Verify session exists in database
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      sendError(res, 401, "Session not found or expired");
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    sendError(res, 500, "Internal server error");
  }
}
