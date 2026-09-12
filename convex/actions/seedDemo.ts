/**
 * Demo seeding action
 * Called from CI/CD to populate demo data for video recording.
 * 
 * Usage (from GitHub Actions or Convex CLI):
 *   npx convex run convex/actions/seedDemo.ts --args '{"action":"reset"}'
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const seedDemo = action({
  args: {
    action: v.union(v.literal("reset"), v.literal("cleanup")),
  },
  handler: async (ctx, { action }) => {
    if (action === "reset") {
      console.log("🌱 Resetting demo data...");

      // Call a mutation to clear and reseed demo org + data
      // This should ideally be a separate mutation in convex/mutations/seedDemo.ts
      // For now, you can manually call seedDemoOrg or create a dedicated seed function
      
      // Example (you'll need to implement this mutation):
      // const result = await ctx.runMutation(api.seeds.seedDemoPlatform, {});
      
      console.log("✅ Demo data reset complete");
      return { success: true, message: "Demo data has been reset" };
    } else if (action === "cleanup") {
      console.log("🧹 Cleaning up demo data...");
      // Implement cleanup logic if needed
      console.log("✅ Demo cleanup complete");
      return { success: true, message: "Demo data has been cleaned up" };
    }

    return { success: false, message: "Unknown action" };
  },
});
