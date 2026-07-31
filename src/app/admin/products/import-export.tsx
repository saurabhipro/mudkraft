"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";

import {
  applyProductImport,
  previewProductImport,
  type ImportPreviewResult,
} from "@/server/actions/product-import";

type Preview = Extract<ImportPreviewResult, { ok: true }>;

/**
 * Excel round trip: download a template or the full catalogue, edit in Excel,
 * upload, review a diff, then apply.
 *
 * Nothing is written until Apply is pressed — a spreadsheet import touches many
 * rows at once, so a mistake found afterwards is expensive to undo.
 */
export function ImportExport() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    setApplied(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await previewProductImport(formData);
      if (!result.ok) {
        setError(result.error);
        setPreview(null);
        return;
      }
      setPreview(result);
    });
  };

  const apply = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await applyProductImport(preview.payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setApplied(`Imported — ${result.created} created, ${result.updated} updated.`);
      setPreview(null);
      router.refresh();
    });
  };

  const close = () => {
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/api/admin/products/template"
          className="inline-flex items-center gap-2 rounded-full border border-earth/25 px-4 py-2.5 text-xs tracking-wider uppercase text-earth transition-colors hover:bg-earth hover:text-cream"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Template
        </a>

        <a
          href="/api/admin/products/export"
          className="inline-flex items-center gap-2 rounded-full border border-earth/25 px-4 py-2.5 text-xs tracking-wider uppercase text-earth transition-colors hover:bg-earth hover:text-cream"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </a>

        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-earth px-4 py-2.5 text-xs tracking-wider uppercase text-cream transition-colors hover:bg-clay disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isPending && !preview ? "Reading…" : "Import"}
        </button>

        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {applied && <p className="mt-3 text-sm text-emerald-800">{applied}</p>}

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-earth/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-t-3xl bg-background sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-earth/12 px-6 py-5">
              <div>
                <h2 className="font-display text-2xl text-earth">Review import</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {preview.creates} to create · {preview.updates} to update ·{" "}
                  {preview.unchanged} unchanged
                  {preview.issues.length > 0 && ` · ${preview.issues.length} problem(s)`}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-earth/15 text-earth hover:bg-cream"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {preview.unknownHeaders.length > 0 && (
                <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Ignored unrecognised columns: {preview.unknownHeaders.join(", ")}
                </p>
              )}

              {preview.issues.length > 0 && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-800">
                    These rows will be skipped:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-800">
                    {preview.issues.slice(0, 25).map((issue, index) => (
                      <li key={index}>
                        {issue.row > 0 && <strong>Row {issue.row}</strong>}
                        {issue.column && ` · ${issue.column}`}
                        {issue.row > 0 || issue.column ? " — " : ""}
                        {issue.message}
                      </li>
                    ))}
                    {preview.issues.length > 25 && (
                      <li>…and {preview.issues.length - 25} more.</li>
                    )}
                  </ul>
                </div>
              )}

              {preview.rows.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Nothing would change. Every row matches what is already stored.
                </p>
              ) : (
                <ul className="space-y-3">
                  {preview.rows.map((row) => (
                    <li key={row.slug} className="rounded-xl border border-earth/12 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="font-medium text-earth">{row.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{row.slug}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-earth">
                            ₹{row.priceInr.toLocaleString("en-IN")}
                            {row.previousPriceInr !== null &&
                              row.previousPriceInr !== row.priceInr && (
                                <span className="ml-2 text-xs text-muted-foreground line-through">
                                  ₹{row.previousPriceInr.toLocaleString("en-IN")}
                                </span>
                              )}
                          </span>
                          <span
                            className={`rounded-md px-2 py-1 text-[11px] uppercase tracking-wide ring-1 ring-inset ${
                              row.action === "create"
                                ? "bg-clay/12 text-clay-deep ring-clay/25"
                                : "bg-earth/8 text-earth/70 ring-earth/15"
                            }`}
                          >
                            {row.action === "create" ? "New · draft" : "Update"}
                          </span>
                        </div>
                      </div>

                      {row.changes.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {row.changes.map((change) => (
                            <li key={change.field}>
                              <span className="text-earth/70">{change.field}:</span>{" "}
                              <span className="line-through">{change.from || "—"}</span> →{" "}
                              <span className="text-earth">{change.to || "—"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-earth/12 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-earth/25 px-5 py-2.5 text-xs tracking-wider uppercase text-earth hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={isPending || preview.rows.length === 0}
                className="rounded-full bg-earth px-6 py-2.5 text-xs tracking-wider uppercase text-cream hover:bg-clay disabled:opacity-50"
              >
                {isPending ? "Applying…" : `Apply ${preview.rows.length} change(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
