/**
 * Product reviews shown on each product page.
 * Every product gets 5 reviews: 4 female names and 1 male name (80:20).
 * Selection is deterministic per product code, so a product always shows
 * the same reviews across visits.
 */

const FEMALE_NAMES = [
  "Priya Sharma", "Anjali Patel", "Neha Desai", "Kavya Iyer", "Meera Nair",
  "Sneha Reddy", "Ritu Verma", "Pooja Mehta", "Divya Kulkarni", "Ishita Joshi",
  "Aarti Gupta", "Nisha Rao", "Shreya Bhatt", "Tanvi Shah", "Lakshmi Menon",
  "Fatima Khan", "Simran Kaur", "Riya Malhotra", "Komal Thakkar", "Bhavna Trivedi",
];

const MALE_NAMES = ["Rahul Mehta", "Arjun Reddy", "Vikram Singh", "Karan Shah", "Aditya Joshi"];

const REVIEW_TEXTS = [
  "Beautifully packed and the {p} looks even better in person. Our whole family loved it for Diwali.",
  "Exactly as shown in the photos. The finishing is neat and the colours are rich.",
  "Ordered the {p} as a housewarming gift and it was a huge hit. Will definitely order again.",
  "Lovely handmade quality. You can tell real care went into every detail.",
  "Arrived safely and on time. It has transformed our entrance — guests keep asking where we got it.",
  "The {p} is sturdy, well made and perfect for the festive season. Very happy with the purchase.",
  "Gifted this to my mother-in-law and she was thrilled. Thank you for the thoughtful packaging.",
  "Great value for handcrafted work. The details are beautiful up close.",
  "Customer service was quick to answer my questions before ordering. The {p} is just right.",
  "Adds such a warm, festive touch to our home. Simple, elegant and well finished.",
];

export type ProductReview = { name: string; rating: number; message: string };

function hashCode(code: string): number {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function getProductReviews(code: string, productName: string): ProductReview[] {
  const h = hashCode(code);
  const female: ProductReview[] = [];

  for (let k = 0; k < 4; k++) {
    const name = FEMALE_NAMES[(h + k * 5) % FEMALE_NAMES.length];
    const message = REVIEW_TEXTS[(h + k * 3) % REVIEW_TEXTS.length].replace("{p}", productName);
    const rating = (h + k) % 3 === 0 ? 4 : 5;
    female.push({ name, rating, message });
  }

  const male: ProductReview = {
    name: MALE_NAMES[h % MALE_NAMES.length],
    rating: h % 4 === 0 ? 4 : 5,
    message: REVIEW_TEXTS[(h + 7) % REVIEW_TEXTS.length].replace("{p}", productName),
  };

  // Place the single male review at a varying position
  const out = [...female];
  out.splice(h % 5, 0, male);
  return out;
}
