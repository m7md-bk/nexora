# Nexora

Nexora is a bilingual (English/Arabic) full-stack subscription and service-delivery platform for an AI content and digital marketing business in Jordan. It includes a database-driven public site, secure customer workspace, role-protected admin operations, subscriptions, orders, manual payments, invoices, content requests, CMS records, notifications, and real-data analytics.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS and customized shadcn/ui components
- PostgreSQL and Prisma ORM
- Database-backed opaque sessions with secure HTTP-only cookies
- Zod validation, React Hook Form, Recharts, Sonner
- Vitest for business-logic tests

## Requirements

- Node.js 20 or later
- pnpm 9 or later
- PostgreSQL 15 or later (local or any managed PostgreSQL provider)

## Local installation

1. Clone the repository and install dependencies with your preferred Node package workflow.
2. Copy `.env.example` to `.env` and replace every required placeholder.
3. Create an empty PostgreSQL database and set `DATABASE_URL`.
4. Generate the Prisma client with the `db:generate` package script.
5. Create/apply the initial migration with the `db:migrate` package script.
6. Seed clearly labeled development records with the `db:seed` package script.
7. Start development with the `dev` package script.

The seed administrator defaults are for local development only. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding, then change the password immediately. Demo FAQ/testimonial records have `isDemo=true` and can be removed safely without affecting analytics.

## Environment variables

See `.env.example` for the complete list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Server-only PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical public URL |
| `AUTH_SECRET` | Yes | High-entropy authentication secret |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Development | Initial administrator |
| `EMAIL_*` | For email flows | SMTP delivery for verification/reset |
| `PAYMENT_PROVIDER` | Yes | `manual` initially; future adapter name |
| `PAYMENT_WEBHOOK_SECRET` | Gateway only | Verifies provider webhooks |
| `STORAGE_*` | For files | Private S3-compatible object storage |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Optional | Analytics tag configured by the owner |

Never prefix secrets with `NEXT_PUBLIC_`. Never commit `.env` files.

## Database and migrations

`prisma/schema.prisma` is the source of truth. It contains indexed relations for users/roles, sessions, profiles, packages/features, services, subscriptions/items, orders/items, payments/methods, invoices, coupons/usages, content requests/deliveries, notifications, CMS content, settings, contact messages, and audit trails.

For a new environment, set `DATABASE_URL`, run the migration workflow, and then run the deploy-safe migration command in production. Prisma uses parameterized queries and database constraints. Human-readable order numbers are allocated through the transactional `OrderCounter` table to prevent duplicates.

## Authentication and authorization

Passwords are hashed with bcrypt (cost 12). Sessions store only a SHA-256 token hash in PostgreSQL; the raw opaque token is kept in an HTTP-only, `SameSite=Lax`, production-secure cookie. Admin and customer layouts call server-side authorization before rendering. Roles are `SUPER_ADMIN`, `ADMIN`, `STAFF`, and `CUSTOMER`.

Server Actions provide same-origin CSRF protection. Inputs are validated at boundaries with Zod. Security headers are configured in `next.config.ts`. Add infrastructure rate limiting (for example, a Vercel Firewall rule or Redis-backed limiter) before exposing authentication publicly.

## Payments

The initial `ManualPaymentAdapter` never marks a payment successful automatically. A manual submission remains `PENDING` until an authorized administrator approves or rejects it. `src/server/payments.ts` updates the payment, order, invoice, subscription, notification, and audit log atomically.

To add an online gateway:

1. Implement the `PaymentAdapter` interface in `src/lib/business.ts`.
2. Store provider credentials only in server environment variables.
3. Add a signed webhook route that verifies `PAYMENT_WEBHOOK_SECRET`.
4. Map provider states to the internal payment statuses.
5. Make processing idempotent using the provider transaction reference.

## Secure file storage

Content files are designed for a private S3-compatible bucket. Configure the `STORAGE_*` variables and issue short-lived signed upload/download URLs from authenticated server routes. Never make customer content buckets public. Enforce MIME, extension, and size limits at upload boundaries.

## Tests and production build

- `test`: runs Vitest business-logic tests.
- `build`: generates the Prisma client and creates an optimized Next.js build.
- `db:deploy`: applies committed migrations in production.

Before release, test login and role boundaries with separate customer/staff/admin accounts, payment review, package CRUD, request ownership, mobile layouts, empty states, and the production database backup/restore process.

## Deploying to Vercel

1. Push the project to GitHub and import it into Vercel.
2. Add all production environment variables in Project Settings.
3. Use a PostgreSQL database reachable from Vercel and enable connection pooling if the provider requires it.
4. Apply migrations through a protected deployment job before serving the new release.
5. Build with the package `build` script and deploy.

### Custom domain

Add the domain in Vercel **Settings → Domains**, create the DNS records Vercel displays, wait for verification/TLS issuance, then set `NEXT_PUBLIC_APP_URL` to the HTTPS production URL and redeploy. Configure your email sender domain separately with SPF, DKIM, and DMARC.

## Production checklist

- Replace seed credentials and remove demo rows (`isDemo=true`).
- Use a unique high-entropy `AUTH_SECRET`.
- Configure SMTP, private object storage, backups, and monitoring.
- Add edge/infrastructure rate limits for login, registration, reset, contact, and uploads.
- Confirm canonical URL, SEO settings, legal copy, contact information, currency, and timezone in admin settings.
- Validate all staff permissions against least privilege before launch.
