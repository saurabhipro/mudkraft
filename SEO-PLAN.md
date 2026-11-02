# Mudkraft: SEO, AI search and launch plan

Last updated: 2 Nov 2026 (evening). Live site: https://www.mudkraft.com

How to read this file:

- **YOU** = work only you can do (accounts, logins, content, money, anything on Google/Meta/GitHub/Lovable).
- **ME** = work Claude does in this repo or on the VM once you say go.
- Each step has a **done when** line so you can tell it is finished.
- Do each section in order. Steps inside a section are in priority order.

---

## 0. Where we are

| Item | State |
|---|---|
| Live release on the VM | `81ea34e` (code-identical to `main`; later commits only removed a stray junk file) |
| Search Console | Verified (file method), sitemap submitted, indexing requested |
| Bing Webmaster Tools | Imported from Search Console |
| Google Analytics 4 | `G-F16PQW6P0C` live in the site |
| Merchant Center | Account created; feed `https://www.mudkraft.com/feeds/google.xml` added |
| Google Business Profile | Created; verification pending |
| `mudkraft.lovable.app` | **Taken down** (returns 404 "Project not found"). Done. |
| Push-to-deploy (GitHub Actions) | **Broken**, see section 1 |
| Meta Pixel | Code live, **off** until a Pixel ID is set |
| Speed (live, phone) | Measured 2 Nov: load 0.5-1.0 s, layout shift 0, home film not downloaded at load. Nothing to fix. |
| IndexNow (Bing) | Built: key file + automatic ping when the catalogue changes + `npm run indexnow` for all pages |
| Review prompts | Built: "Review your pieces" button in the delivered email, and review links on the delivered order page |
| Instagram | Hidden in the footer until a handle is set |

Why the site is not in Google search yet: Google had never heard of "mudkraft", so it suggests "muscraft".
Nothing blocks indexing (no noindex, `robots.txt` allows Google, `mudkraft.com` redirects to `www`). What is missing is
time and outside signals: links to the site from elsewhere, and the old duplicate site still being up.
Expect: brand search in days to about two weeks; product searches in weeks to months.

---

## 1. Fix "push does not deploy" (do this first)

**Cause.** The GitHub workflow connects to the VM as user `deploy`. On the VM that user has only **Bikriup's** key, which
is locked to Bikriup's deploy script. The Mudkraft key and its sudo rule from the runbook
(`bikriup/deploy/mudkraft/README.md`, lines 47-63) were never installed, and the three GitHub secrets may be missing.
The typecheck job passes (fixed on 2 Nov); only the "Deploy to server" step fails.

**Until this is fixed**, deploy by hand (works, about 4 minutes):

```bash
cd /mnt/e/FL/mudkraft
git checkout main && git pull
git bundle create /tmp/mudkraft.bundle HEAD
ssh bikriup /usr/local/bin/mudkraft-deploy < /tmp/mudkraft.bundle
```

**The fix, 3 parts. Part A needs your approval for me to do it on the VM, or you can run it yourself.**

A. **VM (ME on your go-ahead, or YOU).** A key already exists at `~/.ssh/mudkraft_deploy` (private) and
`~/.ssh/mudkraft_deploy.pub`. Install it on the VM with its own forced command and a sudo rule limited to that one script:

```bash
PUB=$(cat ~/.ssh/mudkraft_deploy.pub)
ssh bikriup "cp -p /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys.bak && \
  echo 'restrict,command=\"sudo -n /usr/local/bin/mudkraft-deploy\" $PUB' >> /home/deploy/.ssh/authorized_keys"
ssh bikriup "echo 'deploy ALL=(root) NOPASSWD: /usr/local/bin/mudkraft-deploy' > /etc/sudoers.d/mudkraft-deploy && \
  chmod 440 /etc/sudoers.d/mudkraft-deploy && visudo -c"
```

Then test it from your computer (this runs a real deploy of `main`):

```bash
git bundle create /tmp/m.bundle HEAD
ssh -i ~/.ssh/mudkraft_deploy deploy@45.64.105.211 < /tmp/m.bundle
```

B. **GitHub secrets (YOU).** Repo `saurabhipro/mudkraft` > Settings > Secrets and variables > Actions > New repository secret.
Create or overwrite all three:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `45.64.105.211` |
| `DEPLOY_KNOWN_HOSTS` | `45.64.105.211 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFwsyWwIgmD+SVzdVdXg2ZaMxRsa3BibIEcAt8wvjiRD` |
| `DEPLOY_SSH_KEY` | the whole output of `cat ~/.ssh/mudkraft_deploy` (including the BEGIN and END lines) |

Do not use Bikriup's key. Never paste the private key anywhere else.

C. **Workflow (ME, done).** It now names the missing secret, or the "Permission denied" cause, in the error message.

**Done when:** pushing to `main` shows both jobs green in the repo's Actions tab, and
`ssh bikriup 'basename $(readlink /opt/mudkraft/current)'` prints the new commit.

---

## 2. YOU: do these now (about 1-2 hours)

1. ~~Take down `mudkraft.lovable.app`~~ **Done 2 Nov** (verified: 404).
2. **Merchant Center feed.** Merchant Center > Products > Diagnostics. Send me any "Disapproved" or error text.
   *Done when* products show as Approved (out-of-stock items are fine).
3. **Merchant Center settings.** Add the shipping (free delivery in India, 2-3 day dispatch, 2-9 days transit) and returns
   (7 days) to match the site. Claim the website (the same Search Console verification works).
4. **Google Business Profile.** Finish verification (video or postcard). Use the exact same name, address and phone as on
   the site: **+91 70420 05946**. Category "Pottery store", second category "Pottery class".
5. **Fix data in Bikriup admin:**
   - The Handi 1.5 L costs **more** (Rs 1,200) than the 2.5 L (Rs 1,170). Correct the price.
   - Rename the three **"Water Cooler"** products (8/12/18) to **"Clay Matka Water Pot"**. Tell me if the web address
     (slug) changes, so I can add redirects.
   - Set real stock on the five out-of-stock items.
   - Write a real description for each product (first sentence should say "unglazed clay handi / mitti ki handi",
     what it is for, the size, and that it is lab-tested).
6. **Link your accounts to the website.** `https://www.mudkraft.com` in: the Facebook page's website field, the YouTube
   channel's About links, and the first line of every YouTube video description.
7. **Instagram.** Create the account, put the website in the bio, and send me the handle (goes in footer + schema).
8. **Meta Business.** Create a Meta Pixel and send me the Pixel ID. Later, a Conversions API access token.

---

## 3. YOU: check Search Console (day 2, day 5, day 10)

1. Search Console > Indexing > Pages. Note the count of "Indexed" and the reason for every "Not indexed" page.
2. URL Inspection on `https://www.mudkraft.com/`. Click "Test live URL", then check it says "URL is available to Google".
3. Quick test on Google: search `site:www.mudkraft.com`. No results = not indexed yet. Some results = indexed.
4. Request indexing for pages not yet requested (limit is about 10 a day): `/clay-handi`, `/clay-kadai`, `/dahi-handi`,
   `/clay-water-pot`, `/journal`, then each journal guide.
5. GA4 > Admin > DebugView: visit `https://www.mudkraft.com/?debug_mode=1` in a private window with no ad blocker and
   check `page_view`, `view_item`, `add_to_cart` arrive.

**Done when** the home page and the five category pages are "Indexed".
If a page stays "Crawled, currently not indexed" after about 10 days, send me the page and I will review its content.

---

## 4. ME: next code batch (say "go" and send the items marked *needs*)

| # | Work | Needs from you |
|---|---|---|
| 1 | ~~**IndexNow**~~ **Done.** After each deploy run `npm run indexnow` once (also pings automatically when you edit products in Bikriup) | nothing |
| 2 | **Instagram link** in footer + site schema | Instagram handle |
| 3 | **Meta Pixel on** (code is live, only needs the ID in the VM env, then a rebuild) | Pixel ID |
| 4 | **Meta Conversions API** (server side purchase events, de-duplicated with the Pixel) | Meta access token |
| 5 | ~~**Review prompts**~~ **Done** (delivered email + order page) | nothing |
| 6 | **More guides.** Done: how to cook dal in a clay handi. Next: best handi size for a family; a Hindi mitti ke bartan page | review the copy |
| 7 | **Banners and announcement bar**, edited in Bikriup admin (Bikriup deploy first, then Mudkraft) | the offer messages |
| 8 | ~~**Speed pass**~~ **Done**: measured on the live site, already fast. Re-check after the banners ship | nothing |
| 9 | **Auto-deploy check** after section 1 | section 1 done |

Rules I follow so the SEO stays safe: no health claims the lab report does not support; one shipping/returns wording
from `src/lib/policy.ts`; every indexable page has one H1, a unique title and a canonical; never fake stock or reviews.

---

## 5. YOU: off-site work that decides ranking (weeks 1-8)

This matters more than any code. Google trusts a brand other sites mention.

1. **Directories (same name, address, phone everywhere):** Justdial, IndiaMART, Sulekha, TradeIndia, Google Maps.
2. **Khurja and craft bodies:** pottery cluster associations, state handicraft sites, craft-fair pages. Ask for a link.
3. **Creators and bloggers:** send a handi to 5-6 NCR home-cook creators (5K-25K followers); ask them to link
   `https://www.mudkraft.com/clay-handi` in their post or video description.
4. **YouTube:** title videos with search words ("How a clay handi is made | mitti ki handi"); add the site link; pin it.
5. **Pinterest** boards for clay cooking, linking to category pages.
6. **Answers on Quora and Reddit** to real questions about clay cooking and matkas. Be honest and useful; link only where it helps.
7. **Reviews:** ask first buyers on WhatsApp for 15-25 reviews with photos (send them the product page link).
8. **Press:** one local article or story about the studio and workshops.
9. **Marketplaces later:** Amazon Karigar and Flipkart Samarth after you have reviews.

---

## 6. AI search (Gemini, ChatGPT, Perplexity)

There is no secret tag. What actually works:

- **Gemini and Google AI Overviews** use Google's own index. Being indexed in Google is the whole first step.
- **ChatGPT search and Copilot** lean mainly on **Bing's index**. Hence the Bing import and IndexNow.
- **Google Shopping and Gemini shopping answers** use the Merchant Center feed. Keep it approved and accurate.
- **All of them** reward: one clear entity (Organization schema with Facebook, YouTube, Instagram), facts that match
  everywhere (name, phone, address), plain answer-style pages (our journal and FAQs), reviews, and mentions on other sites.
- **YouTube** is heavily used by Google's AI. Good video titles and descriptions help.
- `llms.txt` and the AI-crawler rules in `robots.txt` are in place. They cost nothing, but no AI engine has promised to use them.

---

## 7. Weekly routine (10 minutes, every Monday)

1. Search Console > Performance: write down impressions and clicks for `mudkraft`, `mitti ki handi`, `clay handi`,
   `clay cookware`, `matka`. Impressions rising first, then clicks, is the real sign of progress.
2. Search Console > Pages: indexed count; any new errors.
3. Merchant Center > Diagnostics: approved count; any new errors.
4. GA4 > Reports > Acquisition: where visitors come from; which page they land on.
5. Check `site:www.mudkraft.com` and a Google search for `mudkraft`.

**Targets:** brand search shows the site within about 2 weeks; first impressions for product searches within about 4 weeks;
first clicks within 6-8 weeks; Merchant listings approved within about 2 weeks.

---

## 8. Reference

- **Pages:** `/clay-cookware`, `/clay-handi`, `/clay-kadai`, `/dahi-handi`, `/clay-water-pot`, `/journal` and its guides.
- **Machine files:** `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/feeds/google.xml`.
- **Google ownership file:** `public/google09fe92b08d04b89a.html`. Never delete it, or Search Console loses verification.
- **Where code lives:** `src/lib/categories.ts` (category copy), `src/lib/articles.ts` (guides), `src/lib/policy.ts`
  (delivery and returns wording), `src/lib/schema.ts` (structured data), `src/lib/analytics.ts` (GA4 and Meta events),
  `src/lib/catalogue.ts` (phone, Facebook, Instagram).
- **Environment variables** (set in `/etc/mudkraft.env` on the VM; the public ones are baked in at build, so rebuild after a change):

  | Variable | Purpose | Status |
  |---|---|---|
  | `NEXT_PUBLIC_GA_ID` | GA4 | set |
  | `NEXT_PUBLIC_GADS_ID` | Google Ads conversions | not needed yet |
  | `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel | **needs your ID** |
  | `GOOGLE_SITE_VERIFICATION` | Search Console tag method | not needed (file method used) |

- **Support phone:** +91 70420 05946 (WhatsApp `917042005946`). Set in `src/lib/whatsapp.ts` and `src/lib/catalogue.ts`.
- **Rollback of a bad deploy:** the script rolls back by itself if the health check fails. By hand:
  `ssh bikriup 'ls -t /opt/mudkraft/releases | head'`, then point `/opt/mudkraft/current` at the previous release and
  `systemctl restart mudkraft`.
