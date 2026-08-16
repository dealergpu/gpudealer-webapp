import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, savedListingsTable, listingsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { SaveListingBody, UnsaveListingParams } from "@workspace/api-zod";

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

router.get("/saved", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db
    .select({ listing: listingsTable })
    .from(savedListingsTable)
    .innerJoin(listingsTable, eq(savedListingsTable.listingId, listingsTable.id))
    .where(eq(savedListingsTable.userId, auth.userId));

  res.json(rows.map((r) => toListingJson(r.listing)));
});

router.post("/saved", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SaveListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db
    .insert(savedListingsTable)
    .values({ userId: auth.userId, listingId: parsed.data.listingId })
    .onConflictDoNothing()
    .returning();

  res.status(201).json({ listingId: parsed.data.listingId, savedAt: row?.savedAt?.toISOString() ?? new Date().toISOString() });
});

router.delete("/saved/:listingId", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const params = UnsaveListingParams.safeParse({ listingId: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid listing ID" }); return; }

  await db.delete(savedListingsTable).where(
    and(eq(savedListingsTable.userId, auth.userId), eq(savedListingsTable.listingId, params.data.listingId)),
  );
  res.sendStatus(204);
});

export default router;
