import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // gpu | server | memory | other
  manufacturer: text("manufacturer"),
  model: text("model"),
  vram: integer("vram"), // GB
  quantity: integer("quantity").notNull().default(1),
  condition: text("condition").notNull(), // new | used | refurbished
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  location: text("location"),
  description: text("description"),
  status: text("status").notNull().default("published"), // draft | pending_review | published | rejected | sold | expired
  source: text("source").notNull().default("gpudealer"), // gpudealer | external
  externalUrl: text("external_url"),
  verified: boolean("verified").notNull().default(false),
  imageUrls: text("image_urls").array().notNull().default([]),
  sellerId: text("seller_id"), // Clerk user ID
  sellerName: text("seller_name"),
  // GPU server fields
  gpuCount: integer("gpu_count"),
  ram: text("ram"),
  cpu: text("cpu"),
  storage: text("storage"),
  networking: text("networking"),
  // Memory fields
  memType: text("mem_type"),
  memCapacity: text("mem_capacity"),
  memSpeed: text("mem_speed"),
  ecc: boolean("ecc"),
  formFactor: text("form_factor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
