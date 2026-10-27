import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { DEJAVU_REGULAR_B64, DEJAVU_BOLD_B64 } from "./pdf-fonts";
import { formatINR, formatDateTime } from "./format";
import { statusLabel } from "./data";

export type PdfOrder = {
  orderNumber: string;
  createdAt: Date | string;
  orderStatus: string;
  paymentStatus: string;
  paymentRef: string | null;
  customerName: string;
  customerMobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCharge: number;
  orderTotal: number;
};
export type PdfItem = { name: string; code: string; qty: number; price: number };
export type PdfShop = { phone?: string; email?: string; address?: string };

const PLUM = rgb(0.259, 0.149, 0.184);
const PLUMSOFT = rgb(0.478, 0.373, 0.412);
const ROSE = rgb(0.769, 0.341, 0.494);
const ROSEDEEP = rgb(0.62, 0.231, 0.376);
const BLUSH = rgb(0.976, 0.91, 0.933);
const LINE = rgb(0.9, 0.86, 0.87);
const SAGE = rgb(0.376, 0.54, 0.4);

const W = 595.28;
const H = 841.89;
const M = 42;

/** Build a clean A4 order slip PDF. Returns the PDF file bytes. */
export async function buildOrderPdf(order: PdfOrder, items: PdfItem[], shop: PdfShop): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const reg = await doc.embedFont(Buffer.from(DEJAVU_REGULAR_B64, "base64"), { subset: true });
  const bold = await doc.embedFont(Buffer.from(DEJAVU_BOLD_B64, "base64"), { subset: true });
  doc.setTitle(`Order ${order.orderNumber}`);
  doc.setAuthor("Shiv Soul Creations");

  const supported = new Set(reg.getCharacterSet());
  const clean = (s: string) =>
    String(s ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .split("")
      .map((ch) => (supported.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");

  let page: PDFPage = doc.addPage([W, H]);
  let y = H;

  const text = (s: string, x: number, yy: number, size: number, font: PDFFont, color = PLUM) =>
    page.drawText(clean(s), { x, y: yy, size, font, color });
  const widthOf = (s: string, size: number, font: PDFFont) => font.widthOfTextAtSize(clean(s), size);
  const right = (s: string, xr: number, yy: number, size: number, font: PDFFont, color = PLUM) =>
    text(s, xr - widthOf(s, size, font), yy, size, font, color);

  function wrap(s: string, maxW: number, size: number, font: PDFFont): string[] {
    const words = clean(s).split(" ").filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      let word = w;
      while (font.widthOfTextAtSize(word, size) > maxW && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxW) cut--;
        if (cur) {
          lines.push(cur);
          cur = "";
        }
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      const test = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxW) cur = test;
      else {
        if (cur) lines.push(cur);
        cur = word;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  /* ---------- Header band ---------- */
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: BLUSH });
  page.drawRectangle({ x: 0, y: H - 100, width: W, height: 4, color: ROSE });
  text("Shiv Soul Creations", M, H - 50, 21, bold, PLUM);
  text("Handcrafted festive décor & gifting", M, H - 68, 9, reg, PLUMSOFT);
  right("ORDER SLIP", W - M, H - 38, 9, bold, PLUMSOFT);
  right(order.orderNumber, W - M, H - 60, 20, bold, ROSEDEEP);
  right(formatDateTime(order.createdAt), W - M, H - 78, 9, reg, PLUMSOFT);
  y = H - 132;

  /* ---------- Status chips ---------- */
  const chip = (label: string, value: string, x: number, good: boolean) => {
    const t = `${label}: ${value}`;
    const w = widthOf(t, 9, bold) + 20;
    page.drawRectangle({
      x,
      y: y - 6,
      width: w,
      height: 22,
      color: good ? rgb(0.9, 0.95, 0.91) : BLUSH,
      borderColor: good ? SAGE : ROSE,
      borderWidth: 0.6,
    });
    text(t, x + 10, y + 1, 9, bold, good ? SAGE : ROSEDEEP);
    return x + w + 8;
  };
  let cx = M;
  cx = chip("Order", statusLabel(order.orderStatus), cx, ["confirmed", "processing", "shipped", "delivered"].includes(order.orderStatus));
  chip("Payment", statusLabel(order.paymentStatus), cx, order.paymentStatus === "paid");
  y -= 40;

  /* ---------- Customer + shop blocks ---------- */
  const colW = (W - M * 2 - 24) / 2;
  const topY = y;
  text("DELIVER TO", M, y, 8.5, bold, ROSE);
  let ly = y - 16;
  text(order.customerName, M, ly, 12, bold);
  ly -= 15;
  text(`+91 ${order.customerMobile}`, M, ly, 10, reg, PLUMSOFT);
  ly -= 15;
  for (const l of wrap(order.addressLine, colW, 10, reg)) {
    text(l, M, ly, 10, reg);
    ly -= 13.5;
  }
  text(`${order.city}, ${order.state} — ${order.pincode}`, M, ly, 10, reg);
  ly -= 13.5;

  const sx = M + colW + 24;
  text("FROM", sx, topY, 8.5, bold, ROSE);
  let ry = topY - 16;
  text("Shiv Soul Creations", sx, ry, 12, bold);
  ry -= 15;
  for (const part of [shop.phone ? `+91 ${shop.phone}` : "", shop.email || ""]) {
    if (!part) continue;
    text(part, sx, ry, 10, reg, PLUMSOFT);
    ry -= 14;
  }
  if (shop.address) {
    for (const l of wrap(shop.address, colW, 10, reg)) {
      text(l, sx, ry, 10, reg, PLUMSOFT);
      ry -= 13.5;
    }
  }
  y = Math.min(ly, ry) - 22;

  /* ---------- Items table ---------- */
  const cols = { qty: W - M - 190, price: W - M - 100, amount: W - M };
  const nameW = cols.qty - 40 - M - 14;

  const drawHeader = () => {
    page.drawRectangle({ x: M, y: y - 8, width: W - M * 2, height: 26, color: PLUM });
    text("ITEM", M + 10, y, 8.5, bold, rgb(1, 1, 1));
    right("QTY", cols.qty, y, 8.5, bold, rgb(1, 1, 1));
    right("PRICE", cols.price, y, 8.5, bold, rgb(1, 1, 1));
    right("AMOUNT", cols.amount - 10, y, 8.5, bold, rgb(1, 1, 1));
    y -= 12;
  };
  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - 56;
  };
  drawHeader();

  for (const it of items) {
    const nameLines = wrap(it.name, nameW, 10.5, bold);
    const rowH = nameLines.length * 14 + 12 + 12;
    if (y - rowH < 80) {
      newPage();
      drawHeader();
    }
    const top = y;
    let ty = top - 14;
    for (const l of nameLines) {
      text(l, M + 10, ty, 10.5, bold);
      ty -= 14;
    }
    text(it.code, M + 10, ty, 8.5, reg, PLUMSOFT);
    right(String(it.qty), cols.qty, top - 14, 10.5, reg);
    right(formatINR(it.price), cols.price, top - 14, 10.5, reg);
    right(formatINR(it.price * it.qty), cols.amount - 10, top - 14, 10.5, bold);
    y = top - rowH;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
  }

  /* ---------- Totals ---------- */
  if (y < 160) newPage();
  y -= 18;
  const lx = W - M - 230;
  const row = (label: string, value: string, color = PLUM, valueColor = PLUM) => {
    text(label, lx, y, 10, reg, color);
    right(value, W - M - 10, y, 10, bold, valueColor);
    y -= 18;
  };
  row("Subtotal", formatINR(order.subtotal), PLUMSOFT);
  if (order.discount > 0) row(`Coupon (${order.couponCode || "discount"})`, `− ${formatINR(order.discount)}`, SAGE, SAGE);
  row("Delivery", order.shippingCharge === 0 ? "FREE" : formatINR(order.shippingCharge), PLUMSOFT, order.shippingCharge === 0 ? SAGE : PLUM);
  page.drawRectangle({ x: lx - 10, y: y - 24, width: W - M - lx + 10, height: 30, color: BLUSH });
  text("TOTAL", lx, y - 13, 11, bold, PLUM);
  right(formatINR(order.orderTotal), W - M - 10, y - 15, 15, bold, ROSEDEEP);
  y -= 52;

  if (order.paymentRef) {
    text(`Payment reference: ${order.paymentRef}`, M, y, 8.5, reg, PLUMSOFT);
    y -= 14;
  }

  /* ---------- Footer on every page ---------- */
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 52 }, end: { x: W - M, y: 52 }, thickness: 0.5, color: LINE });
    p.drawText(clean("Thank you for shopping with Shiv Soul Creations! Prices shown are as charged at order time."), {
      x: M,
      y: 36,
      size: 8.5,
      font: reg,
      color: PLUMSOFT,
    });
    const pg = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pg, { x: W - M - reg.widthOfTextAtSize(pg, 8.5), y: 36, size: 8.5, font: reg, color: PLUMSOFT });
  });

  return doc.save();
}
