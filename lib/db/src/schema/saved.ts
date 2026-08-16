import {
  pgTable,
  integer,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { listingsTable } from "./listings";

export const savedListingsTable = pgTable(
  "saved_listings",
  {
    userId: text("user_id").notNull(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listingsTable.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.listingId] })],
);
