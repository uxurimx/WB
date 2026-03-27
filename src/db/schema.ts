import { pgTable, text, varchar, timestamp } from 'drizzle-orm/pg-core';

// Users — synced from Clerk via webhook or on first sign-in
// Extend this table with app-specific fields as needed
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'), // e.g. 'admin', 'member'
  createdAt: timestamp('created_at').defaultNow(),
});
