import express, { Request, Response } from "express";
import { sendError, sendSuccess } from "../auth";
import { authenticateRequest } from "../middleware";
import prisma from "../db";

const router = express.Router();

// Get Git config
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

      const gitConfig = await prisma.gitConfig.findUnique({
        where: { projectId },
      });

      if (!gitConfig) {
        sendError(res, 404, "Git config not found");
        return;
      }

      sendSuccess(res, gitConfig);
    } catch (error) {
      console.error("Get git config error:", error);
      sendError(res, 500, "Failed to fetch git config");
    }
  }
);

// Update Git config
router.patch(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { prWorkflow, pushRepoUrl, pushBranch } = req.body;

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

      const gitConfig = await prisma.gitConfig.update({
        where: { projectId },
        data: {
          ...(prWorkflow !== undefined && { prWorkflow }),
          ...(pushRepoUrl !== undefined && { pushRepoUrl }),
          ...(pushBranch !== undefined && { pushBranch }),
        },
      });

      sendSuccess(res, gitConfig);
    } catch (error) {
      console.error("Update git config error:", error);
      sendError(res, 500, "Failed to update git config");
    }
  }
);

// Set GitHub token for project
router.post(
  "/:projectId/github-token",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { accessToken, scope, tokenType } = req.body;

      if (!accessToken) {
        sendError(res, 400, "GitHub access token is required");
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

      // Delete existing token if any
      await prisma.githubToken.deleteMany({
        where: { projectId },
      });

      // Create new token
      const githubToken = await prisma.githubToken.create({
        data: {
          projectId,
          accessToken,
          scope,
          tokenType: tokenType || "bearer",
        },
      });

      sendSuccess(res, { message: "GitHub token updated" }, 201);
    } catch (error) {
      console.error("Set GitHub token error:", error);
      sendError(res, 500, "Failed to set GitHub token");
    }
  }
);

export default router;
