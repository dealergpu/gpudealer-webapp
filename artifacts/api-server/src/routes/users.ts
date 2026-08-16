import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";
import { UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

// JIT provision user record on first profile fetch
async function ensureUser(userId: string, email: string, displayName?: string | null) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!existing) {
    await db.insert(usersTable).values({ id: userId, email, displayName: displayName ?? null }).onConflictDoNothing();
    const [created] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return created;
  }
  return existing;
}

router.get("/users/profile", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  let email = "";
  let displayName: string | null = null;
  try {
    const clerkUser = await clerkClient(req).users.getUser(auth.userId);
    email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    displayName = clerkUser.fullName ?? clerkUser.username ?? null;
  } catch {
    // proceed without Clerk data
  }

  const user = await ensureUser(auth.userId, email, displayName);
  res.json({
    id: user.id,
    email: user.email || email,
    displayName: user.displayName,
    company: user.company,
    location: user.location,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/profile", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, auth.userId)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json({
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    company: updated.company,
    location: updated.location,
    bio: updated.bio,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
