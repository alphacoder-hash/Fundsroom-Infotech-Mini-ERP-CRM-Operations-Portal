import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const BLACK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.45, 0.45, 0.45);
const ACCENT = rgb(0.18, 0.52, 0.89);
const LINE = rgb(0.88, 0.88, 0.88);

export async function exportChallanPDF(challan: any) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  const text = (str: string, x: number, yPos: number, size = 10, font = regular, color = BLACK) => {
    page.drawText(String(str), { x, y: yPos, size, font, color });
  };

  const line = (yPos: number) => {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 0.5, color: LINE });
  };

  // Header bar
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: ACCENT });
  text('FUNDSROOM ERP', margin, height - 32, 18, bold, rgb(1, 1, 1));
  text('Sales Challan / Invoice', margin, height - 52, 10, regular, rgb(0.85, 0.92, 1));

  y = height - 96;

  // Challan meta (top-right)
  text(challan.challanNumber, width - margin - 140, y, 14, bold, ACCENT);
  text(`Status: ${challan.status}`, width - margin - 140, y - 18, 9, regular, MUTED);
  text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, width - margin - 140, y - 32, 9, regular, MUTED);

  // Bill To
  text('BILL TO', margin, y, 8, bold, MUTED);
  y -= 16;
  text(challan.customer?.name || '-', margin, y, 11, bold);
  y -= 14;
  if (challan.customer?.businessName) { text(challan.customer.businessName, margin, y, 9, regular, MUTED); y -= 13; }
  if (challan.customer?.mobile) { text(`Mobile: ${challan.customer.mobile}`, margin, y, 9, regular, MUTED); y -= 13; }
  if (challan.customer?.gstNumber) { text(`GST: ${challan.customer.gstNumber}`, margin, y, 9, regular, MUTED); y -= 13; }

  y -= 8;
  line(y);
  y -= 16;

  // Table header
  const cols = { product: margin, sku: margin + 200, qty: margin + 310, price: margin + 375, subtotal: margin + 455 };
  page.drawRectangle({ x: margin, y: y - 4, width: width - margin * 2, height: 20, color: rgb(0.95, 0.97, 1) });
  text('Product', cols.product, y + 4, 9, bold, MUTED);
  text('SKU', cols.sku, y + 4, 9, bold, MUTED);
  text('Qty', cols.qty, y + 4, 9, bold, MUTED);
  text('Unit Price', cols.price, y + 4, 9, bold, MUTED);
  text('Subtotal', cols.subtotal, y + 4, 9, bold, MUTED);
  y -= 20;
  line(y);
  y -= 14;

  // Table rows
  let total = 0;
  for (const item of challan.items || []) {
    const subtotal = item.quantity * parseFloat(item.unitPriceSnapshot);
    total += subtotal;
    const name = item.productNameSnapshot?.length > 28
      ? item.productNameSnapshot.slice(0, 26) + '..'
      : item.productNameSnapshot;
    text(name, cols.product, y, 9, regular);
    text(item.skuSnapshot || '-', cols.sku, y, 9, regular, MUTED);
    text(String(item.quantity), cols.qty, y, 9, regular);
    text(`Rs.${parseFloat(item.unitPriceSnapshot).toFixed(2)}`, cols.price, y, 9, regular);
    text(`Rs.${subtotal.toFixed(2)}`, cols.subtotal, y, 9, bold);
    y -= 18;
    line(y + 4);
    y -= 6;
  }

  // Total row
  y -= 4;
  page.drawRectangle({ x: margin, y: y - 6, width: width - margin * 2, height: 26, color: rgb(0.95, 0.97, 1) });
  text('TOTAL', cols.price, y + 6, 10, bold, ACCENT);
  text(`Rs.${total.toFixed(2)}`, cols.subtotal, y + 6, 11, bold, ACCENT);

  // Footer
  line(margin + 30);
  text(`Created by: ${challan.user?.email || '-'} (${challan.user?.role || '-'})`, margin, margin + 16, 8, regular, MUTED);
  text('Fundsroom Infotech - ERP/CRM Portal', width - margin - 210, margin + 16, 8, regular, MUTED);

  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${challan.challanNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
