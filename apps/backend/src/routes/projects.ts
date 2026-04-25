import express, { Request, Response } from "express";
import { sendError, sendSuccess } from "../auth";
import { authenticateRequest } from "../middleware";
import prisma from "../db";
import { slugify } from "../utils";

const router = express.Router();

// Create project
router.post(
  "/",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body;

      if (!name) {
        sendError(res, 400, "Project name is required");
        return;
      }

      // Get user's space
      const space = await prisma.space.findUnique({
        where: { userId: req.userId },
      });

      if (!space) {
        sendError(res, 404, "Workspace not found");
        return;
      }

      // Generate unique subdomain
      let subdomain = slugify(name);
      let counter = 1;
      while (
        await prisma.project.findUnique({
          where: { subdomain },
        })
      ) {
        subdomain = `${slugify(name)}-${counter}`;
        counter++;
      }

      // Create project
      const project = await prisma.project.create({
        data: {
          spaceId: space.id,
          name,
          description,
          subdomain,
        },
      });

      // Create default project settings
      await prisma.projectSettings.create({
        data: {
          projectId: project.id,
          settings: {},
        },
      });

      // Create default git config
      await prisma.gitConfig.create({
        data: {
          projectId: project.id,
        },
      });

      sendSuccess(res, project, 201);
    } catch (error) {
      console.error("Create project error:", error);
      sendError(res, 500, "Failed to create project");
    }
  }
);

// Get all projects for user
router.get(
  "/",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const space = await prisma.space.findUnique({
        where: { userId: req.userId },
        include: {
          projects: {
            include: {
              settings: true,
              gitConfig: true,
            },
          },
        },
      });

      if (!space) {
        sendError(res, 404, "Workspace not found");
        return;
      }

      sendSuccess(res, {
        space,
        projects: space.projects,
      });
    } catch (error) {
      console.error("Get projects error:", error);
      sendError(res, 500, "Failed to fetch projects");
    }
  }
);

// Get project by ID
router.get(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

      // Verify project belongs to user's space
      const space = await prisma.space.findUnique({
        where: { userId: req.userId },
      });

      if (!space) {
        sendError(res, 404, "Workspace not found");
        return;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          settings: true,
          gitConfig: true,
          githubToken: {
            select: {
              id: true,
              tokenType: true,
              scope: true,
              createdAt: true,
            },
          },
        },
      });

      if (!project || project.spaceId !== space.id) {
        sendError(res, 403, "Access denied");
        return;
      }

      sendSuccess(res, project);
    } catch (error) {
      console.error("Get project error:", error);
      sendError(res, 500, "Failed to fetch project");
    }
  }
);

// Update project
router.patch(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;

      // Verify project belongs to user's space
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

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
        },
        include: {
          settings: true,
          gitConfig: true,
        },
      });

      sendSuccess(res, updatedProject);
    } catch (error) {
      console.error("Update project error:", error);
      sendError(res, 500, "Failed to update project");
    }
  }
);

// Delete project
router.delete(
  "/:projectId",
  authenticateRequest,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

      // Verify project belongs to user's space
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

      await prisma.project.delete({
        where: { id: projectId },
      });

      sendSuccess(res, { message: "Project deleted successfully" });
    } catch (error) {
      console.error("Delete project error:", error);
      sendError(res, 500, "Failed to delete project");
    }
  }
);

export default router;
