import { NextResponse } from "next/server";

import { ROLE_ADMIN } from "@/server/auth";
import { getSession } from "@/server/auth-guard";
import { getCategorySlugs } from "@/server/excel/product-records";
import { buildProductTemplate } from "@/server/excel/product-workbook";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Empty import template: the same columns as the export, one greyed example
 * row, and a "How to use" sheet explaining every field and the valid values.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (session.user.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const buffer = await buildProductTemplate(await getCategorySlugs());

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": 'attachment; filename="mudkraft-product-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
