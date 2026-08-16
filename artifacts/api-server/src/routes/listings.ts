import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";
import { db, listingsTable, savedListingsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetListingsQueryParams,
  GetListingParams,
  GetFeaturedListingsQueryParams,
  CreateListingBody,
  UpdateListingParams,
  UpdateListingBody,
  DeleteListingParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toListingJson(row: typeof listingsTable.$inferSelect) {
  return {
    ...row,
    price: Number(row.price),
    imageUrls: row.imageUrls ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

router.get("/listings", async (req, res): Promise<void> => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, category, model, manufacturer, vramMin, priceMax, condition, location, sort, page, limit } = parsed.data;
  const safeLimit = Math.min(limit ?? 24, 100);
  const safePage = Math.max(page ?? 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const conditions = [eq(listingsTable.status, "published")];

  if (category) conditions.push(eq(listingsTable.category, category));
  if (model) conditions.push(ilike(listingsTable.model, `%${model}%`));
  if (manufacturer) conditions.push(ilike(listingsTable.manufacturer, `%${manufacturer}%`));
  if (vramMin != null) conditions.push(gte(listingsTable.vram, vramMin));
  if (priceMax != null) conditions.push(lte(listingsTable.price, String(priceMax)));
  if (condition && condition !== "any") conditions.push(eq(listingsTable.condition, condition));
  if (location) conditions.push(ilike(listingsTable.location, `%${location}%`));
  if (q) {
    conditions.push(
      sql`(${listingsTable.title} ILIKE ${"%" + q + "%"} OR ${listingsTable.model} ILIKE ${"%" + q + "%"} OR ${listingsTable.description} ILIKE ${"%" + q + "%"})`,
    );
  }

  let orderBy;
  if (sort === "price_asc") orderBy = asc(listingsTable.price);
  else if (sort === "price_desc") orderBy = desc(listingsTable.price);
  else if (sort === "price_per_gb") orderBy = asc(sql`(${listingsTable.price}::numeric / NULLIF(${listingsTable.vram}, 0))`);
  else orderBy = desc(listingsTable.createdAt);

  const [rows, countRows] = await Promise.all([
    db.select().from(listingsTable).where(and(...conditions)).orderBy(orderBy).limit(safeLimit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(and(...conditions)),
  ]);

  const total = countRows[0]?.count ?? 0;
  res.json({ listings: rows.map(toListingJson), total, page: safePage, limit: safeLimit });
});

router.get("/listings/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db.select().from(listingsTable)
    .where(eq(listingsTable.sellerId, auth.userId))
    .orderBy(desc(listingsTable.createdAt));
  res.json(rows.map(toListingJson));
});

router.get("/listings/featured", async (req, res): Promise<void> => {
  const parsed = GetFeaturedListingsQueryParams.safeParse(req.query);
  const limit = Math.min(parsed.data?.limit ?? 12, 24);

  const rows = await db.select().from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .orderBy(desc(listingsTable.createdAt))
    .limit(limit);
  res.json(rows.map(toListingJson));
});

router.get("/listings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetListingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [row] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Listing not found" }); return; }
  res.json(toListingJson(row));
});

router.post("/listings", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db.insert(listingsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    imageUrls: parsed.data.imageUrls ?? [],
    sellerId: auth.userId,
    status: "pending_review",
  }).returning();
  res.status(201).json(toListingJson(row));
});

router.patch("/listings/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateListingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.sellerId !== auth.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);

  const [updated] = await db.update(listingsTable).set(updateData).where(eq(listingsTable.id, params.data.id)).returning();
  res.json(toListingJson(updated));
});

router.delete("/listings/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteListingParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }
  if (existing.sellerId !== auth.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
