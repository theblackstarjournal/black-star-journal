# BSJ Website Guide

How the site is built, where everything lives, and how to use the shared BSJ account.

---

## Structure

Two apps, one GitHub repo, both deployed on Vercel:

| App | Folder | What it is |
|---|---|---|
| Frontend | `frontend/` | Public-facing site (Vite + React) |
| Backend/CMS | `black-star-cms/` | Payload CMS admin (Next.js) — editors log in here to manage content |

Data lives outside both apps:

| Service | Holds |
|---|---|
| MongoDB Atlas | All content — issues, pieces, sections, users |
| Cloudflare R2 | All media — images, PDFs, video |

---

## Accounts

Everything is owned by one shared identity: **`blackstarjournal@brown.edu`**

| Service | Owned by | Members |
|---|---|---|
| GitHub | Org: `black-star-journal` | Add people directly as Org members |
| MongoDB Atlas | Org: Black Star Journal | Add people directly as Org members |
| Cloudflare (R2) | `blackstarjournal@brown.edu`'s account | Add people directly as account members |
| Vercel | `blackstarjournal@brown.edu`'s account | **Log in with the shared account** — Vercel's free plan doesn't support adding members |

Credentials for `blackstarjournal@brown.edu` (email + Vercel login) are in the shared password vault.

---

## How to use the shared Vercel account

Vercel's free plan is capped at 1 member, so instead of individual logins, everyone shares one account:

1. Get the `blackstarjournal@brown.edu` Vercel password from the shared vault
2. Log in at vercel.com with it
3. Both projects (`frontend`, `black-star-cms`) are visible from that one login
4. Log out when done if on a shared/public computer

**When someone leaves the team:** rotate this password and update the vault. This is the one account that needs that extra step — GitHub, Atlas, and Cloudflare just need the person removed from the member list instead.

---

## Key config: `clientUploads`

`black-star-cms/src/payload.config.ts` has `clientUploads: true` set on the S3 storage plugin. This sends uploaded files browser → R2 directly, skipping the server. **Don't remove this** — without it, files over ~4.5MB fail to upload on Vercel.

```ts
s3Storage({
  collections: { media: true },
  clientUploads: true,
  bucket: process.env.S3_BUCKET || '',
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT || '',
  },
}),
```

This requires a matching CORS policy on the R2 bucket (Cloudflare → bucket → Settings → CORS Policy), allowing `PUT`/`GET` from every domain that uploads through `/admin`:

```json
[
  {
    "AllowedOrigins": [
      "https://black-star-journal.vercel.app",
      "https://<cms-vercel-url>.vercel.app",
      "http://localhost:5000",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

If the CMS is ever redeployed to a new Vercel URL, add that URL to this CORS list.

---

## Environment variables

**Backend (`black-star-cms`):`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_FRONTEND_URL`, `FRONTEND_URL`, `CORS_ORIGINS`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT`

**Frontend (`frontend`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_R2_URL`

All values live in the shared password vault.

---

## Checklist for new editors

- [ ] Add to GitHub org
- [ ] Add to MongoDB Atlas org
- [ ] Add to Cloudflare account
- [ ] Give them the shared Vercel login from the vault
- [ ] Give them the shared password vault access
