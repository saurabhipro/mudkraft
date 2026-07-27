import { NextResponse } from "next/server";

import { ROLE_ADMIN } from "@/server/auth";
import { getSession } from "@/server/auth-guard";
import { getCategorySlugs, getProductExportRecords } from "@/server/excel/product-records";
import { buildProductExport } from "@/server/excel/product-workbook";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Downloads every product as .xlsx, including drafts and archived items. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (session.user.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const [records, categorySlugs] = await Promise.all([
    getProductExportRecords(),
    getCategorySlugs(),
  ]);
  const buffer = await buildProductExport(records, categorySlugs);

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="mudkraft-products-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
