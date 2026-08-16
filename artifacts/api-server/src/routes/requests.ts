import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, hardwareRequestsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetRequestsQueryParams,
  CreateRequestBody,
  UpdateRequestParams,
  UpdateRequestBody,
  DeleteRequestParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toRequestJson(row: typeof hardwareRequestsTable.$inferSelect) {
  return {
    ...row,
    budgetPerUnit: row.budgetPerUnit != null ? Number(row.budgetPerUnit) : null,
    totalBudget: row.totalBudget != null ? Number(row.totalBudget) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/requests", async (req, res): Promise<void> => {
  const parsed = GetRequestsQueryParams.safeParse(req.query);
  const category = parsed.data?.category;
  const limit = Math.min(parsed.data?.limit ?? 20, 100);
  const page = Math.max(parsed.data?.page ?? 1, 1);
  const offset = (page - 1) * limit;

  const conditions = [eq(hardwareRequestsTable.status, "open")];
  if (category) conditions.push(eq(hardwareRequestsTable.category, category));

  const rows = await db.select().from(hardwareRequestsTable)
    .where(and(...conditions))
    .orderBy(desc(hardwareRequestsTable.createdAt))
    .limit(limit)
    .offset(offset);
  res.json(rows.map(toRequestJson));
});

router.post("/requests", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db.insert(hardwareRequestsTable).values({
    ...parsed.data,
    budgetPerUnit: parsed.data.budgetPerUnit != null ? String(parsed.data.budgetPerUnit) : undefined,
    totalBudget: parsed.data.totalBudget != null ? String(parsed.data.totalBudget) : undefined,
    userId: auth.userId,
    status: "open",
  }).returning();
  res.status(201).json(toRequestJson(row));
});

router.get("/requests/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db.select().from(hardwareRequestsTable)
    .where(eq(hardwareRequestsTable.userId, auth.userId))
    .orderBy(desc(hardwareRequestsTable.createdAt));
  res.json(rows.map(toRequestJson));
});

router.patch("/requests/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRequestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(hardwareRequestsTable).where(eq(hardwareRequestsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
  if (existing.userId !== auth.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = UpdateRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.budgetPerUnit != null) updateData.budgetPerUnit = String(parsed.data.budgetPerUnit);
  if (parsed.data.totalBudget != null) updateData.totalBudget = String(parsed.data.totalBudget);

  const [updated] = await db.update(hardwareRequestsTable).set(updateData).where(eq(hardwareRequestsTable.id, params.data.id)).returning();
  res.json(toRequestJson(updated));
});

router.delete("/requests/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRequestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(hardwareRequestsTable).where(eq(hardwareRequestsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
  if (existing.userId !== auth.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(hardwareRequestsTable).where(eq(hardwareRequestsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
