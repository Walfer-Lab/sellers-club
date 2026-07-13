# Sellers Club — Seller Dashboard

A Next.js seller dashboard for the [PDF Lovers](https://pdflovers.app) marketplace. Sellers can manage products, track analytics, process payouts, and configure their storefront.

## Auth

**OTP-only (passwordless).** Both Sellers Club and PDF Lovers share a single Supabase project (`ersuemtbcjynjmmmamwa`). Authentication is via email OTP — no passwords are created or stored.

- **Login = signup**: `signInWithOtp` with `shouldCreateUser: true`. If the email is new, Supabase creates the `auth.users` row and a trigger inserts a `profiles` row automatically.
- **First-time sellers**: After OTP verification, if the user has no `sellers` row, they are redirected to `/dashboard/onboarding` to complete their profile (name, optional phone).
- **Roles**: Stored in `user_roles(user_id, role)`. Sellers get `role = 'seller'` on onboarding. Buyers on PDF Lovers get `role = 'buyer'`.
- **Step-up verification**: Changing UPI/payout details or requesting a fund withdrawal requires a fresh OTP challenge within the last 5 minutes (`utils/requireFreshOtp.ts`). If the check fails, a `StepUpModal` prompts re-verification.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Supabase Auth via `@supabase/ssr`
- **Database**: Supabase (PostgreSQL), project ref `ersuemtbcjynjmmmamwa`
- **Storage**: AWS S3 (`walferlab-file-content`)
- **Styling**: Tailwind CSS v4 — strict black/white/zinc monochrome design
- **Icons**: HugeIcons
- **Fonts**: Cabinet Grotesk (headings), General Sans (body)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

## Key Files

| File | Purpose |
|---|---|
| `app/login/page.tsx` | OTP login page (email → 6-digit code) |
| `app/dashboard/onboarding/page.tsx` | First-time seller profile setup |
| `components/OtpFlow.tsx` | Reusable OTP UI component |
| `components/StepUpModal.tsx` | Step-up re-verification modal |
| `utils/requireFreshOtp.ts` | Server-side fresh OTP assertion |
| `app/actions/Settings.tsx` | Profile + UPI update server actions |
| `app/actions/Payments.tsx` | Withdrawal server action |
| `app/logout/route.ts` | Sign-out route (`GET /logout`) |

## Database Schema

See `supabase/migrations/001_profiles_user_roles.sql` for the full migration.

Key tables:
- `profiles` — mirrors `auth.users`, auto-populated via trigger
- `user_roles(user_id, role)` — role as data; `role ∈ {'buyer', 'seller'}`
- `sellers` — seller profile (name, email, phone_no, upi_id)
- `products`, `seller_metrics`, `seller_payments`, `sales` — core business data

## Deployment

Deployed on Vercel. Set the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_SUPABASE_SERVICE_ROLE_KEY=
AWS_S3_ACCESS_KEY_ID=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_S3_BUCKET_NAME=
```
