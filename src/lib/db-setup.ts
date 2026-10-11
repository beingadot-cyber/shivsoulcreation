import { db } from "@/db";
import { sql } from "drizzle-orm";
import { products, settings, admins } from "@/db/schema";
import { hashPassword } from "./crypto";

const DDL = `
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  mobile_number varchar(10) NOT NULL UNIQUE,
  country_code varchar(5) NOT NULL DEFAULT '+91',
  password_hash text NOT NULL,
  mobile_verified boolean NOT NULL DEFAULT false,
  account_status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username varchar(60) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  product_code varchar(20) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL,
  mrp integer,
  image_url text,
  category varchar(100),
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number varchar(20) NOT NULL UNIQUE,
  customer_id integer,
  customer_name varchar(120) NOT NULL,
  customer_mobile varchar(10) NOT NULL,
  address_line text NOT NULL,
  city varchar(80) NOT NULL,
  state varchar(80) NOT NULL,
  pincode varchar(6) NOT NULL,
  subtotal integer NOT NULL,
  shipping_charge integer NOT NULL DEFAULT 0,
  order_total integer NOT NULL,
  payment_status varchar(30) NOT NULL DEFAULT 'pending',
  order_status varchar(30) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id);
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer,
  product_name_snapshot varchar(200) NOT NULL,
  product_code_snapshot varchar(20) NOT NULL,
  unit_price_snapshot integer NOT NULL,
  quantity integer NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
CREATE TABLE IF NOT EXISTS hero_slides (
  id SERIAL PRIMARY KEY,
  media_url text NOT NULL,
  media_type varchar(10) NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reels (
  id SERIAL PRIMARY KEY,
  video_url text NOT NULL,
  caption varchar(200) NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  customer_name varchar(120) NOT NULL,
  message text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (
  key varchar(100) PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS otp_requests (
  id SERIAL PRIMARY KEY,
  mobile varchar(10) NOT NULL,
  purpose varchar(20) NOT NULL,
  otp_hash text NOT NULL,
  pending_password_hash text,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_mobile_idx ON otp_requests (mobile);
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  token_hash varchar(64) NOT NULL UNIQUE,
  user_type varchar(10) NOT NULL,
  user_id integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions (token_hash);
`;

const SEED_PRODUCTS: {
  code: string;
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  featured?: boolean;
  bestseller?: boolean;
}[] = [
  { code: "SSC-001", name: "Handcrafted Diya Thali", price: 175, category: "Diya & Thali", description: "A beautifully handcrafted decorative diya thali adorned with festive embellishments. Perfect for pooja rituals, Diwali celebrations and as a thoughtful festive gift.", stock: 25, bestseller: true },
  { code: "SSC-002", name: "Peacock Shubh Labh Hanging", price: 175, category: "Shubh Labh", description: "Elegant peacock-themed Shubh Labh hanging for doors and entrances. A charming symbol of prosperity and good fortune for your home.", stock: 30, bestseller: true },
  { code: "SSC-003", name: "Floral Shubh Labh Hanging Set", price: 200, category: "Shubh Labh", description: "Delicate floral Shubh Labh hanging set, handcrafted to bring festive warmth to your doorway during celebrations.", stock: 22 },
  { code: "SSC-004", name: "Blue Evil Eye Hanging Décor", price: 399, category: "Wall Hangings", description: "Striking blue evil eye hanging décor piece that blends protection symbolism with graceful handcrafted styling.", stock: 15, featured: true },
  { code: "SSC-005", name: "Lotus & Pearl Shubh Labh Hanging Set", price: 250, category: "Shubh Labh", description: "Graceful lotus and pearl Shubh Labh hanging set. A soft, feminine accent piece for festive entrances and pooja spaces.", stock: 18 },
  { code: "SSC-006", name: "Peacock Floral Tea Light Holder", price: 450, category: "Tea Lights", description: "Ornate peacock and floral tea light holder that casts a warm festive glow. A statement décor piece for tables and corners.", stock: 12, bestseller: true },
  { code: "SSC-007", name: "Pink Floral Mirror Work Toran", price: 899, category: "Torans", description: "Vibrant pink floral toran with traditional mirror work. Handcrafted to brighten doorways with festive elegance.", stock: 10, featured: true },
  { code: "SSC-008", name: "Double Peacock Shubh Labh Hanging", price: 399, category: "Shubh Labh", description: "Double peacock Shubh Labh hanging with rich detailing. Brings a regal festive touch to entrances and pooja rooms.", stock: 14 },
  { code: "SSC-009", name: "Blue Floral Shubh Labh Hanging Set", price: 375, category: "Shubh Labh", description: "Serene blue floral Shubh Labh hanging set, handcrafted with delicate detailing for festive doorways.", stock: 16, bestseller: true },
  { code: "SSC-010", name: "Pink Floral Tea Light Holder Pair", price: 175, category: "Tea Lights", description: "Charming pink floral tea light holders, sold as a pair (2 pieces). Adds a soft, romantic glow to festive tablescapes and pooja thalis.", stock: 28, bestseller: true },
  { code: "SSC-011", name: "Maroon & White Floral Festive Toran", price: 1100, category: "Torans", description: "Luxurious maroon and white floral festive toran. A premium handcrafted statement piece for grand entrances.", stock: 8, featured: true },
  { code: "SSC-012", name: "Festive Table Runner & Diya Holder Set", price: 450, category: "Table Décor", description: "Coordinated festive table runner with matching diya holders. Transforms your dining or console table for celebrations.", stock: 12 },
  { code: "SSC-013", name: "Square Diya / Pooja Thali", price: 175, category: "Diya & Thali", description: "Contemporary square diya / pooja thali with handcrafted festive detailing. Ideal for rituals and gifting.", stock: 25 },
  { code: "SSC-014", name: "Peacock & Pearl Shubh Labh Toran", price: 1100, category: "Torans", description: "Majestic peacock and pearl Shubh Labh toran. A premium handcrafted showpiece for festive entrances.", stock: 8, featured: true },
  { code: "SSC-015", name: "Lotus, Pearl & Bell Toran", price: 1100, category: "Torans", description: "Dreamy lotus, pearl and bell toran that pairs soft florals with gentle chimes. Perfect for pooja rooms and doorways.", stock: 9, bestseller: true },
];

const SETTING_DEFAULTS: Record<string, string> = {
  store_name: "Shiv Soul Creations",
  tagline: "Handcrafted festive décor & gifting",
  about:
    "Shiv Soul Creations is a small handcrafted studio creating festive décor, torans, Shubh Labh hangings, diya thalis and gifting pieces with love and care. Every piece is made by hand, in small batches, for homes that celebrate beautifully.",
  whatsapp_number: "",
  contact_mobile: "",
  contact_email: "",
  instagram_url: "",
  upi_id: "",
  upi_name: "Shiv Soul Creations",
  shipping_charge: "50",
  business_address: "",
  announcement: "Handcrafted with love • Festive décor & gifting",
  shipping_policy:
    "Orders are processed within 2-4 business days. Each piece is handcrafted, so please allow a little extra time during festive season. Delivery timelines depend on your location (typically 4-8 business days after dispatch). Shipping charges are calculated at checkout.",
  return_policy:
    "As our products are handcrafted and made to order, returns are accepted only for items damaged in transit. Please share an unboxing video and photos within 48 hours of delivery on WhatsApp, and we will arrange a replacement or refund.",
  privacy_policy:
    "We collect only the information needed to fulfil your order (name, mobile number and delivery address). Your data is stored securely, never sold or shared with third parties, and passwords are stored only in securely hashed form.",
  terms:
    "By using this website you agree to our ordering, payment and delivery processes. Product colours may vary slightly as every piece is handcrafted. Prices are subject to change without notice; the price confirmed at checkout applies to your order.",
};

async function setup() {
  await db.execute(sql.raw(DDL));

  // Seed default admin (credentials are changed from Admin Settings)
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "Admin@12345";
  await db
    .insert(admins)
    .values({ username: adminUser, passwordHash: hashPassword(adminPass), role: "admin" })
    .onConflictDoNothing();

  // Seed settings defaults
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }

  // Seed product catalogue
  for (const p of SEED_PRODUCTS) {
    await db
      .insert(products)
      .values({
        productCode: p.code,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        stockQuantity: p.stock,
        isFeatured: !!p.featured,
        isBestseller: !!p.bestseller,
      })
      .onConflictDoNothing();
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __sscDbReady: Promise<void> | undefined;
}

export function ensureDb(): Promise<void> {
  if (!globalThis.__sscDbReady) {
    globalThis.__sscDbReady = setup().catch((err) => {
      globalThis.__sscDbReady = undefined;
      throw err;
    });
  }
  return globalThis.__sscDbReady;
}
