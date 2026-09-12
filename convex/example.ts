/**
 * MINIMAL example endpoints showing the authorization pattern.
 * No business logic — readable template for Wave-1 functions.
 *
 * Both are fully gated through lib/authz.ts.
 */
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentDecimalUser } from "./lib/authz";

/** The orgs the signed-in user is an ACTIVE member of. */
export const getMyOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentDecimalUser(ctx);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const organizations = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.organizationId)),
    );

    return memberships.map((membership, i) => ({
      membershipId: membership._id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      organization: organizations[i],
    }));
  },
});

/** Scaffold a demo org with the caller as super_admin (side-effect only). */
export const seedDemoOrg = mutation({
  args: {
    orgName: v.string(),
    slug: v.string(),
  },
  returns: {
    organizationId: v.id("organizations"),
    membershipId: v.id("memberships"),
    userId: v.id("users"),
  },
  handler: async (ctx, { orgName, slug }) => {
    const user = await getCurrentDecimalUser(ctx);

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing !== null) {
      throw new ConvexError({
        code: "CONFLICT",
        message: `An organization with slug "${slug}" already exists.`,
      });
    }

    const organizationId = await ctx.db.insert("organizations", {
      name: orgName,
      slug,
      status: "active",
      country: "KE",
    });

    const membershipId = await ctx.db.insert("memberships", {
      organizationId,
      userId: user._id,
      role: "super_admin",
      status: "active",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("organizationSettings", {
      organizationId,
      settings: {},
    });

    return { organizationId, membershipId, userId: user._id };
  },
});