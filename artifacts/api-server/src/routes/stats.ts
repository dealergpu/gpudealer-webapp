import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, listingsTable, hardwareRequestsTable, savedListingsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

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

function toRequestJson(row: typeof hardwareRequestsTable.$inferSelect) {
  return {
    ...row,
    budgetPerUnit: row.budgetPerUnit != null ? Number(row.budgetPerUnit) : null,
    totalBudget: row.totalBudget != null ? Number(row.totalBudget) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/stats/dashboard", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [activeListings, pendingListings, openRequests, savedCount, recentListings, recentRequests] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
      .where(eq(listingsTable.sellerId, auth.userId))
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
      .where(sql`${listingsTable.sellerId} = ${auth.userId} AND ${listingsTable.status} = 'pending_review'`)
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(hardwareRequestsTable)
      .where(sql`${hardwareRequestsTable.userId} = ${auth.userId} AND ${hardwareRequestsTable.status} = 'open'`)
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(savedListingsTable)
      .where(eq(savedListingsTable.userId, auth.userId))
      .then((r) => r[0]?.count ?? 0),
    db.select().from(listingsTable)
      .where(eq(listingsTable.sellerId, auth.userId))
      .orderBy(desc(listingsTable.createdAt))
      .limit(5),
    db.select().from(hardwareRequestsTable)
      .where(eq(hardwareRequestsTable.userId, auth.userId))
      .orderBy(desc(hardwareRequestsTable.createdAt))
      .limit(5),
  ]);

  res.json({
    activeListings,
    pendingListings,
    openRequests,
    savedCount,
    recentListings: recentListings.map(toListingJson),
    recentRequests: recentRequests.map(toRequestJson),
  });
});

router.get("/stats/marketplace", async (_req, res): Promise<void> => {
  const [totalListings, totalRequests, popularModels] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
      .where(eq(listingsTable.status, "published"))
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(hardwareRequestsTable)
      .where(eq(hardwareRequestsTable.status, "open"))
      .then((r) => r[0]?.count ?? 0),
    db.select({
      model: listingsTable.model,
      count: sql<number>`count(*)::int`,
    })
      .from(listingsTable)
      .where(sql`${listingsTable.status} = 'published' AND ${listingsTable.model} IS NOT NULL`)
      .groupBy(listingsTable.model)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
  ]);

  res.json({
    totalListings,
    totalRequests,
    popularModels: popularModels.map((r) => ({ model: r.model ?? "", count: r.count })),
  });
});

export default router;
