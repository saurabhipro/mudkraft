import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ bikriup: vi.fn(), bikriupEnabled: vi.fn(() => true) }));
const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("./bikriup", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  bikriup: api.bikriup,
  bikriupEnabled: api.bikriupEnabled,
}));
vi.mock("./email/client", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sendEmail: mail.sendEmail,
}));

const { sendProspectBrochure } = await import("./bikriup-messages");
const { brochureEmail } = await import("./email/templates");

const event = (over: Record<string, unknown> = {}) => ({
  prospect_id: 7,
  send_id: 31,
  to: "purchase@biryaniblues.com",
  company: "Biryani Blues",
  subject: "Mudkraft — our brochure for Biryani Blues",
  message: "Namaste Biryani Blues team,\n\nOur brochure is attached.\n\nRegards,\nMudkraft",
  pdf_url: "https://bikriup.com/brochure/mudkraft/abc/Mudkraft-brochure.pdf",
  filename: "Mudkraft brochure.pdf",
  reply_to: "hello@mudkraft.com",
  ...over,
});

describe("prospect brochure email", () => {
  beforeEach(() => {
    api.bikriup.mockReset().mockResolvedValue({ updated: 1 });
    mail.sendEmail.mockReset().mockResolvedValue(true);
  });

  it("renders the owner's paragraphs, escaped, with the PDF button and an opt-out line", () => {
    const m = brochureEmail({
      subject: "Hi",
      message: "Line <b>one</b>\n\nPara two\nnext",
      pdfUrl: "https://x.test/b.pdf",
      company: "Acme",
    });
    expect(m.html).toContain("Line &lt;b&gt;one&lt;/b&gt;");
    expect(m.html).toContain("Para two<br>next");
    expect(m.html).toContain("https://x.test/b.pdf");
    expect(m.html).toMatch(/no thanks/);
  });

  it("mails the PDF and reports sent", async () => {
    await sendProspectBrochure(event());
    expect(mail.sendEmail).toHaveBeenCalledTimes(1);
    const sent = mail.sendEmail.mock.calls[0][0];
    expect(sent.to).toBe("purchase@biryaniblues.com");
    expect(sent.subject).toBe("Mudkraft — our brochure for Biryani Blues");
    expect(sent.replyTo).toBe("hello@mudkraft.com");
    expect(sent.attachments[0]).toMatchObject({
      filename: "Mudkraft brochure.pdf",
      contentType: "application/pdf",
    });
    expect(api.bikriup).toHaveBeenCalledWith("/prospects/status", {
      method: "POST",
      body: { send_id: 31, status: "sent" },
    });
  });

  it("refuses an http brochure link or a bad address, and says why", async () => {
    await sendProspectBrochure(event({ pdf_url: "http://bikriup.com/x.pdf" }));
    await sendProspectBrochure(event({ to: "not-an-email" }));
    expect(mail.sendEmail).not.toHaveBeenCalled();
    expect(api.bikriup.mock.calls.map((c) => c[1].body.error)).toEqual([
      "The brochure link must be https",
      "Not an email address",
    ]);
  });

  it("reports a mail server refusal as failed", async () => {
    mail.sendEmail.mockResolvedValue(false);
    await sendProspectBrochure(event());
    expect(api.bikriup).toHaveBeenCalledWith("/prospects/status", {
      method: "POST",
      body: { send_id: 31, status: "failed", error: "The mail server did not take it" },
    });
  });
});
