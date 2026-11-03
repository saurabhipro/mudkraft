import { permanentRedirect } from "next/navigation";

// The privacy policy lives on /trust; /privacy is the address Meta, Google and people expect.
export default function PrivacyPage() {
  permanentRedirect("/trust");
}
