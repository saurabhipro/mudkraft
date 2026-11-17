# Mudkraft

The storefront for [mudkraft.com](https://www.mudkraft.com): handmade clay cookware, drinkware and serveware.

Next.js app. In production the catalogue, stock, orders and enquiries come from the shop's Bikriup back office (`BIKRIUP_API_URL`); images are on Cloudinary.

```sh
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
npm run lint
```

Copy `.env.example` to `.env.local` and fill in the values before running.
