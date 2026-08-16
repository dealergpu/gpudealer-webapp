import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hardwareRequestsTable = pgTable("hardware_requests", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // gpu | server | memory | other
  modelRequirement: text("model_requirement").notNull(),
  quantity: integer("quantity").notNull().default(1),
  vramMin: integer("vram_min"), // GB
  budgetPerUnit: numeric("budget_per_unit", { precision: 12, scale: 2 }),
  totalBudget: numeric("total_budget", { precision: 14, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  conditionPreference: text("condition_preference").notNull().default("any"), // new | used | refurbished | any
  destinationCountry: text("destination_country"),
  destinationCity: text("destination_city"),
  requiredBy: text("required_by"), // asap | 1_4_weeks | 1_3_months | flexible
  additionalRequirements: text("additional_requirements"),
  status: text("status").notNull().default("open"), // open | matched | closed | cancelled
  userId: text("user_id"), // Clerk user ID
  userName: text("user_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHardwareRequestSchema = createInsertSchema(hardwareRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHardwareRequest = z.infer<typeof insertHardwareRequestSchema>;
export type HardwareRequest = typeof hardwareRequestsTable.$inferSelect;
