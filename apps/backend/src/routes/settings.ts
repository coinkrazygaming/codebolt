import express, { Request, Response } from "express";
import { sendError, sendSuccess } from "../auth";
import { authenticateRequest } from "../middleware";
import prisma from "../db";

const router = express.Router();

// Get project settings
router.get(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

      // Verify project belongs to user
      const space = await prisma.space.findUnique({
        where: { userId: req.userId },
      });

      if (!space) {
        sendError(res, 404, "Workspace not found");
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.spaceId !== space.id) {
        sendError(res, 403, "Access denied");
        return;
      }

      const settings = await prisma.projectSettings.findUnique({
        where: { projectId },
      });

      if (!settings) {
        sendError(res, 404, "Settings not found");
        return;
      }

      sendSuccess(res, settings);
    } catch (error) {
      console.error("Get settings error:", error);
      sendError(res, 500, "Failed to fetch settings");
    }
  }
);

// Update project settings
router.patch(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { settings } = req.body;

      if (!settings || typeof settings !== "object") {
        sendError(res, 400, "Settings must be a valid object");
        return;
      }

      // Verify project belongs to user
      const space = await prisma.space.findUnique({
        where: { userId: req.userId },
      });

      if (!space) {
        sendError(res, 404, "Workspace not found");
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.spaceId !== space.id) {
        sendError(res, 403, "Access denied");
        return;
      }

      const updatedSettings = await prisma.projectSettings.update({
        where: { projectId },
        data: {
          settings,
        },
      });

      sendSuccess(res, updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      sendError(res, 500, "Failed to update settings");
    }
  }
);

export default router;
