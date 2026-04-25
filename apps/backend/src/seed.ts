import prisma from "./db";
import { hashPassword } from "./auth";

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "coinkrazy26@gmail.com" },
  });

  if (existingAdmin) {
    if (existingAdmin.isAdmin) {
      console.log("✅ Admin user already exists");
    } else {
      // Update to make admin
      await prisma.user.update({
        where: { email: "coinkrazy26@gmail.com" },
        data: { isAdmin: true },
      });
      console.log("✅ Updated existing user to admin");
    }
  } else {
    // Create new admin user
    const hashedPassword = await hashPassword("admin123");
    const adminUser = await prisma.user.create({
      data: {
        email: "coinkrazy26@gmail.com",
        password: hashedPassword,
        name: "Admin",
        isAdmin: true,
      },
    });

    // Create default admin space
    await prisma.space.create({
      data: {
        userId: adminUser.id,
        name: "Admin Space",
      },
    });

    console.log("✅ Created admin user (coinkrazy26@gmail.com / admin123)");
  }

  // Create default site settings if not exists
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        siteName: "Website Builder AI",
        primaryDomain: "builder.local",
        supportEmail: "support@example.com",
      },
    });
    console.log("✅ Created default site settings");
  }

  // Create default pricing plans if not exists
  const existingPlans = await prisma.pricingPlan.count();
  if (existingPlans === 0) {
    await prisma.pricingPlan.createMany({
      data: [
        {
          name: "Free",
          price: 0,
          currency: "USD",
          projects: 1,
          storage: 1,
          features: JSON.parse(JSON.stringify(["1 Project", "1 GB Storage"])),
          isActive: true,
        },
        {
          name: "Pro",
          price: 29,
          currency: "USD",
          projects: 10,
          storage: 100,
          features: JSON.parse(
            JSON.stringify([
              "10 Projects",
              "100 GB Storage",
              "Advanced Analytics",
              "Priority Support",
            ])
          ),
          isActive: true,
        },
        {
          name: "Enterprise",
          price: 99,
          currency: "USD",
          projects: 100,
          storage: 1000,
          features: JSON.parse(
            JSON.stringify([
              "100 Projects",
              "1000 GB Storage",
              "Advanced Analytics",
              "24/7 Support",
              "Custom Integrations",
              "Dedicated Account Manager",
            ])
          ),
          isActive: true,
        },
      ],
    });
    console.log("✅ Created default pricing plans");
  }

  console.log("🎉 Database seed completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
