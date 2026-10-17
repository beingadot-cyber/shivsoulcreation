import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  mobileNumber: varchar("mobile_number", { length: 10 }).notNull().unique(),
  countryCode: varchar("country_code", { length: 5 }).notNull().default("+91"),
  passwordHash: text("password_hash").notNull(),
  mobileVerified: boolean("mobile_verified").notNull().default(false),
  accountStatus: varchar("account_status", { length: 20 })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: varchar("product_code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  mrp: integer("mrp"),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 100 }),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  customerId: integer("customer_id"),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerMobile: varchar("customer_mobile", { length: 10 }).notNull(),
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  pincode: varchar("pincode", { length: 6 }).notNull(),
  subtotal: integer("subtotal").notNull(),
  shippingCharge: integer("shipping_charge").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 30 }),
  orderTotal: integer("order_total").notNull(),
  paymentStatus: varchar("payment_status", { length: 30 })
    .notNull()
    .default("pending"),
  orderStatus: varchar("order_status", { length: 30 })
    .notNull()
    .default("pending"),
  paymentRef: varchar("payment_ref", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  productNameSnapshot: varchar("product_name_snapshot", {
    length: 200,
  }).notNull(),
  productCodeSnapshot: varchar("product_code_snapshot", {
    length: 20,
  }).notNull(),
  unitPriceSnapshot: integer("unit_price_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
});

export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  mediaUrl: text("media_url").notNull(),
  mediaType: varchar("media_type", { length: 10 }).notNull().default("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  videoUrl: text("video_url").notNull(),
  caption: varchar("caption", { length: 200 }).notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  message: text("message").notNull(),
  rating: integer("rating").notNull().default(5),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull().default(""),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  userType: varchar("user_type", { length: 10 }).notNull(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type Reel = typeof reels.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
