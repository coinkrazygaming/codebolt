import express, { Request, Response } from "express";
import { sendError, sendSuccess, hashPassword } from "../auth";
import { authenticateRequest, requireAdmin } from "../middleware";
import prisma from "../db";

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateRequest);
router.use(requireAdmin);

// ==================== USERS MANAGEMENT ====================

// Get all users
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { users });
  } catch (error) {
    console.error("Get users error:", error);
    sendError(res, 500, "Failed to fetch users");
  }
});

// Get user by ID
router.get("/users/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        spaces: {
          include: {
            projects: true,
          },
        },
      },
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
});

// Update user admin status
router.patch(
  "/users/:userId/admin",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isAdmin },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
        },
      });

      sendSuccess(res, { user });
    } catch (error) {
      console.error("Update user admin status error:", error);
      sendError(res, 500, "Failed to update user");
    }
  }
);

// Delete user
router.delete(
  "/users/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      await prisma.user.delete({
        where: { id: userId },
      });

      sendSuccess(res, { message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      sendError(res, 500, "Failed to delete user");
    }
  }
);

// ==================== SPACES/WORKSPACES MANAGEMENT ====================

// Get all spaces
router.get("/spaces", async (req: Request, res: Response): Promise<void> => {
  try {
    const spaces = await prisma.space.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        projects: true,
      },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { spaces });
  } catch (error) {
    console.error("Get spaces error:", error);
    sendError(res, 500, "Failed to fetch spaces");
  }
});

// Get space by ID
router.get(
  "/spaces/:spaceId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { spaceId } = req.params;
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: {
          user: true,
          projects: {
            include: {
              settings: true,
            },
          },
        },
      });

      if (!space) {
        sendError(res, 404, "Space not found");
        return;
      }

      sendSuccess(res, { space });
    } catch (error) {
      console.error("Get space error:", error);
      sendError(res, 500, "Failed to fetch space");
    }
  }
);

// Delete space
router.delete(
  "/spaces/:spaceId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { spaceId } = req.params;

      await prisma.space.delete({
        where: { id: spaceId },
      });

      sendSuccess(res, { message: "Space deleted successfully" });
    } catch (error) {
      console.error("Delete space error:", error);
      sendError(res, 500, "Failed to delete space");
    }
  }
);

// ==================== PROJECTS MANAGEMENT ====================

// Get all projects
router.get(
  "/projects",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          space: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          settings: true,
        },
        orderBy: { createdAt: "desc" },
      });

      sendSuccess(res, { projects });
    } catch (error) {
      console.error("Get projects error:", error);
      sendError(res, 500, "Failed to fetch projects");
    }
  }
);

// Delete project
router.delete(
  "/projects/:projectId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

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

// ==================== SITE SETTINGS ====================

// Get site settings
router.get(
  "/settings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {},
        });
      }

      sendSuccess(res, { settings });
    } catch (error) {
      console.error("Get settings error:", error);
      sendError(res, 500, "Failed to fetch settings");
    }
  }
);

// Update site settings
router.patch(
  "/settings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        siteName,
        primaryDomain,
        supportEmail,
        maintenanceMode,
        maintenanceMessage,
      } = req.body;

      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            ...(siteName && { siteName }),
            ...(primaryDomain && { primaryDomain }),
            ...(supportEmail && { supportEmail }),
            ...(maintenanceMode !== undefined && { maintenanceMode }),
            ...(maintenanceMessage && { maintenanceMessage }),
          },
        });
      } else {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: {
            ...(siteName && { siteName }),
            ...(primaryDomain && { primaryDomain }),
            ...(supportEmail && { supportEmail }),
            ...(maintenanceMode !== undefined && { maintenanceMode }),
            ...(maintenanceMessage && { maintenanceMessage }),
          },
        });
      }

      sendSuccess(res, { settings });
    } catch (error) {
      console.error("Update settings error:", error);
      sendError(res, 500, "Failed to update settings");
    }
  }
);

// ==================== PRICING PLANS ====================

// Get all pricing plans
router.get(
  "/pricing",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const plans = await prisma.pricingPlan.findMany({
        orderBy: { price: "asc" },
      });

      sendSuccess(res, { plans });
    } catch (error) {
      console.error("Get pricing plans error:", error);
      sendError(res, 500, "Failed to fetch pricing plans");
    }
  }
);

// Create pricing plan
router.post(
  "/pricing",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        price,
        currency,
        projects,
        storage,
        features,
      } = req.body;

      if (!name || price === undefined || !projects || !storage) {
        sendError(res, 400, "Missing required fields");
        return;
      }

      const plan = await prisma.pricingPlan.create({
        data: {
          name,
          price,
          currency: currency || "USD",
          projects,
          storage,
          features: features || [],
        },
      });

      sendSuccess(res, { plan }, 201);
    } catch (error) {
      console.error("Create pricing plan error:", error);
      sendError(res, 500, "Failed to create pricing plan");
    }
  }
);

// Update pricing plan
router.patch(
  "/pricing/:planId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { planId } = req.params;
      const updates = req.body;

      const plan = await prisma.pricingPlan.update({
        where: { id: planId },
        data: updates,
      });

      sendSuccess(res, { plan });
    } catch (error) {
      console.error("Update pricing plan error:", error);
      sendError(res, 500, "Failed to update pricing plan");
    }
  }
);

// Delete pricing plan
router.delete(
  "/pricing/:planId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { planId } = req.params;

      await prisma.pricingPlan.delete({
        where: { id: planId },
      });

      sendSuccess(res, { message: "Pricing plan deleted successfully" });
    } catch (error) {
      console.error("Delete pricing plan error:", error);
      sendError(res, 500, "Failed to delete pricing plan");
    }
  }
);

// ==================== AI KEYS MANAGEMENT ====================

// Get all AI keys
router.get(
  "/ai-keys",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const keys = await prisma.aiKey.findMany({
        select: {
          id: true,
          provider: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, { keys });
    } catch (error) {
      console.error("Get AI keys error:", error);
      sendError(res, 500, "Failed to fetch AI keys");
    }
  }
);

// Create AI key
router.post(
  "/ai-keys",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider, key } = req.body;

      if (!provider || !key) {
        sendError(res, 400, "Provider and key are required");
        return;
      }

      const aiKey = await prisma.aiKey.create({
        data: {
          provider,
          key,
        },
        select: {
          id: true,
          provider: true,
          isActive: true,
          createdAt: true,
        },
      });

      sendSuccess(res, { key: aiKey }, 201);
    } catch (error) {
      console.error("Create AI key error:", error);
      sendError(res, 500, "Failed to create AI key");
    }
  }
);

// Update AI key
router.patch(
  "/ai-keys/:keyId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyId } = req.params;
      const { isActive } = req.body;

      const aiKey = await prisma.aiKey.update({
        where: { id: keyId },
        data: { isActive },
        select: {
          id: true,
          provider: true,
          isActive: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, { key: aiKey });
    } catch (error) {
      console.error("Update AI key error:", error);
      sendError(res, 500, "Failed to update AI key");
    }
  }
);

// Delete AI key
router.delete(
  "/ai-keys/:keyId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyId } = req.params;

      await prisma.aiKey.delete({
        where: { id: keyId },
      });

      sendSuccess(res, { message: "AI key deleted successfully" });
    } catch (error) {
      console.error("Delete AI key error:", error);
      sendError(res, 500, "Failed to delete AI key");
    }
  }
);

// ==================== API KEYS MANAGEMENT ====================

// Get all API keys
router.get(
  "/api-keys",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const keys = await prisma.apiKey.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          rateLimit: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, { keys });
    } catch (error) {
      console.error("Get API keys error:", error);
      sendError(res, 500, "Failed to fetch API keys");
    }
  }
);

// Create API key
router.post(
  "/api-keys",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, rateLimit } = req.body;

      if (!name) {
        sendError(res, 400, "Name is required");
        return;
      }

      // Generate API key and secret
      const key = `key_${Math.random().toString(36).substring(2, 15)}`;
      const secret = `secret_${Math.random().toString(36).substring(2, 15)}`;

      const apiKey = await prisma.apiKey.create({
        data: {
          name,
          key,
          secret: secret, // In production, this should be encrypted
          rateLimit: rateLimit || 1000,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          rateLimit: true,
        },
      });

      sendSuccess(res, { key: apiKey, secret }, 201);
    } catch (error) {
      console.error("Create API key error:", error);
      sendError(res, 500, "Failed to create API key");
    }
  }
);

// Update API key
router.patch(
  "/api-keys/:keyId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyId } = req.params;
      const { isActive, rateLimit } = req.body;

      const apiKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(rateLimit !== undefined && { rateLimit }),
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          rateLimit: true,
        },
      });

      sendSuccess(res, { key: apiKey });
    } catch (error) {
      console.error("Update API key error:", error);
      sendError(res, 500, "Failed to update API key");
    }
  }
);

// Delete API key
router.delete(
  "/api-keys/:keyId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { keyId } = req.params;

      await prisma.apiKey.delete({
        where: { id: keyId },
      });

      sendSuccess(res, { message: "API key deleted successfully" });
    } catch (error) {
      console.error("Delete API key error:", error);
      sendError(res, 500, "Failed to delete API key");
    }
  }
);

// ==================== STATISTICS & BILLING ====================

// Get platform statistics
router.get(
  "/stats",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const totalUsers = await prisma.user.count();
      const totalProjects = await prisma.project.count();
      const totalSpaces = await prisma.space.count();

      // Get active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await prisma.session.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        distinct: ["userId"],
        select: {
          userId: true,
        },
      });

      // Get recent signups
      const newUsersThisMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      // Get billing records
      const totalRevenue = await prisma.billingRecord.aggregate({
        where: {
          status: "completed",
        },
        _sum: {
          amount: true,
        },
      });

      const stats = {
        totalUsers,
        totalProjects,
        totalSpaces,
        activeUsers: activeUsers.length,
        newUsersThisMonth,
        totalRevenue: totalRevenue._sum.amount || 0,
      };

      sendSuccess(res, { stats });
    } catch (error) {
      console.error("Get stats error:", error);
      sendError(res, 500, "Failed to fetch statistics");
    }
  }
);

// Get billing records
router.get(
  "/billing",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const records = await prisma.billingRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      sendSuccess(res, { records });
    } catch (error) {
      console.error("Get billing records error:", error);
      sendError(res, 500, "Failed to fetch billing records");
    }
  }
);

export default router;
