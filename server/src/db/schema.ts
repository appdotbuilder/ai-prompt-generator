import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enum for request status
export const requestStatusEnum = pgEnum('request_status', ['pending', 'processing', 'completed', 'failed']);

export const imageGenerationRequestsTable = pgTable('image_generation_requests', {
  id: serial('id').primaryKey(),
  user_idea: text('user_idea').notNull(),
  expanded_prompt: text('expanded_prompt').notNull(),
  image_url: text('image_url'), // Nullable by default, set when image is generated
  status: requestStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'), // Nullable by default, set when request is completed
});

// TypeScript types for the table schema
export type ImageGenerationRequest = typeof imageGenerationRequestsTable.$inferSelect; // For SELECT operations
export type NewImageGenerationRequest = typeof imageGenerationRequestsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { imageGenerationRequests: imageGenerationRequestsTable };