# WedPlan — Wedding Planning Platform

WedPlan is a full-stack wedding services marketplace for Bangladesh. Customers can discover vendors and request bookings, vendors can manage services and subscriptions, and administrators can moderate the marketplace.

**Author** — Faruk Ahmed  
**Assignment** — Assignment 9 · Category 004  
**Project contact** — faruk@wedplan.com

## Project Links

| Item | Link |
| --- | --- |
| Live website (Vercel) | |
| Live backend API (Render) | |
| Full-stack GitHub repository | https://github.com/srfarukahmed/WedPlan-Full-Stack |
| Client GitHub repository | https://github.com/srfarukahmed/WedPlan-Client-Side |
| Server GitHub repository | https://github.com/srfarukahmed/WedPlan-Server-Side |

## Features

| Role | Available features |
| --- | --- |
| Visitor | Browse featured services and six service categories. Search by keyword, filter by location, category, or budget, and sort by price. |
| Customer | View service galleries, submit booking requests, track decisions, cancel pending requests, and edit profile information. |
| Vendor | Create and edit listings, view approval status, manage availability, accept or reject pending requests, and manage Free or Premium subscriptions. |
| Admin | Search and filter users, block or unblock accounts, review and moderate services, and view read-only transaction history. |

- Responsive wedding-themed interface with light and dark modes.
- Email/password authentication and Google Sign-In when configured.
- Protected dashboards with server-side JWT, session, role, and ownership checks.
- Stripe Checkout in test mode with signature-verified payment webhooks.
- Image upload, WebP conversion, MongoDB GridFS storage, and optional ImgBB mirroring.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, JavaScript, Tailwind CSS, shadcn/ui |
| UI behavior | Motion, Lucide React, Sonner |
| Backend | Node.js, Express, JavaScript, Zod |
| Authentication | Better Auth, Google OAuth, JOSE |
| Database and media | MongoDB, GridFS, Sharp, ImgBB |
| Payments | Stripe Checkout and signed webhooks |
| Hosting | Vercel for the frontend, Render for the backend |

## Folder Structure

```text
WedPlan/
├── README.md
├── render.yaml
├── frontend/
│   ├── app/                 # Next.js routes, layouts, and styles
│   ├── components/          # Pages, forms, dashboards, and reusable UI
│   ├── lib/                 # API client, platform mode, and demo data
│   ├── public/              # Logo and bundled photos
│   ├── .env.example
│   ├── next.config.mjs      # Next.js configuration and API proxy
│   ├── package.json
│   └── README.md
└── backend/
    ├── src/
    │   ├── server.js        # Server startup and shutdown
    │   ├── app.js           # Express middleware and API registration
    │   ├── auth.js          # Better Auth and authorization middleware
    │   ├── config.js        # Environment validation
    │   ├── db.js            # MongoDB connection, collections, and indexes
    │   ├── images.js        # Image processing, GridFS, and ImgBB
    │   ├── validation.js    # API request schemas
    │   └── routes/
    │       ├── marketplace.js
    │       └── payments.js
    ├── scripts/
    │   └── seed.js
    ├── seed-assets/
    ├── test/
    ├── .env.example
    ├── package.json
    └── README.md
```

[Frontend documentation](frontend/README.md) · [Backend documentation](backend/README.md)

## Quick Start

### Prerequisites

- Node.js **22 or later** and npm
- MongoDB Atlas or a local MongoDB replica set
- Two terminals for running the frontend and backend
- Google OAuth, Stripe test, and ImgBB credentials for their respective integrations

Commands below use Windows PowerShell. On macOS or Linux, use `npm` in place of `npm.cmd`.

### 1. Install and Configure the Backend

From the `WedPlan` project root, open the first terminal.

```powershell
cd backend
npm.cmd ci
Copy-Item .env.example .env
```

Run the copy command only when `.env` is absent. If it already exists, open and update it directly.

For MongoDB Atlas, create a database user, allow your development IP under **Network Access**, and copy the application connection string into `MONGODB_URI`. Use an Atlas cluster or replica set because WedPlan uses MongoDB transactions.

Generate a Better Auth secret.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Set `backend/.env` as follows. Replace the empty values with your own settings as needed.

```dotenv
PORT=4000
MONGODB_URI=
MONGODB_DB=wedplan

FRONTEND_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:4000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

IMGBB_API_KEY=

FARUK_ADMIN_EMAIL=
FARUK_ADMIN_PASSWORD=
FARUK_VENDOR_EMAIL=
FARUK_VENDOR_PASSWORD=
FARUK_CUSTOMER_EMAIL=
FARUK_CUSTOMER_PASSWORD=
```

`MONGODB_URI` and `BETTER_AUTH_SECRET` are required to boot with the local URL settings above. `FRONTEND_URL` controls the permitted frontend origin and Stripe return URLs. `BETTER_AUTH_URL` is the browser-facing auth origin. `PUBLIC_API_URL` is the API origin used to serve uploaded images.

### 2. Seed Accounts and Sample Listings

Set the admin email and password in `backend/.env`. Add vendor and customer credentials if you want to create those accounts.

```powershell
npm.cmd run seed
```

For a fresh database with six approved sample services, set vendor credentials and run:

```powershell
npm.cmd run seed -- --catalog
```

The seed preserves existing account passwords. Public registration offers Customer and Vendor roles. Admin access is assigned through the private seed process.

### 3. Start and Verify the Backend

```powershell
npm.cmd run dev
```

From a second terminal, check the API.

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/api/services
```

The health endpoint should return `status: ok`. A fresh database can return an empty catalog until services are seeded or approved.

### 4. Install and Start the Frontend

Open another terminal from the `WedPlan` root.

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env.local
```

If `.env.local` already exists, update it directly.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=proxy
WEDPLAN_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
NEXT_PUBLIC_FARUK_CONTACT_EMAIL=faruk@wedplan.com
NEXT_PUBLIC_FARUK_SOCIAL_URL=https://www.instagram.com/md___faruk_ahmed/
```

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

In proxy mode, the browser sends `/api/*` requests to the frontend origin, and Next.js forwards them to Express. Use the same browser-facing origin in `FRONTEND_URL` and `BETTER_AUTH_URL`. Keep private credentials in the backend environment and commit only environment templates.

## Run One App Independently

### Frontend Only

Frontend demo mode uses sample data and simulated payments. It requires no backend or database. Set `frontend/.env.local` to:

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=demo
WEDPLAN_BACKEND_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
```

From `frontend`, run `npm.cmd ci` and `npm.cmd run dev`. Open the Sign In page and use the **Customer**, **Vendor**, or **Admin** demo button. Switch back to `proxy` mode and restart the frontend when connecting it to the real API.

### Backend Only

From `backend`, configure `.env` and run `npm.cmd ci` followed by `npm.cmd run dev`. Test `/health` and `/api/services` directly at `http://localhost:4000`. Use `npm.cmd start` to run without watch mode.

## Configure Integrations

### Google Sign-In

1. Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/auth/clients).
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`. If the consent app is in testing mode, add the intended Google account as a test user.
5. Restart the backend. In WedPlan, choose **Continue with Google** and confirm that the signed-in session survives a dashboard refresh.

New Google accounts receive the Customer role. The production callback uses the deployed frontend origin and the same callback path.

### Stripe Test Checkout

1. Create an active recurring price in a Stripe sandbox for WedPlan Premium.
2. Save the sandbox API key and recurring price ID as `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`.
3. Run the Stripe CLI listener in a separate terminal using the same sandbox.

```powershell
stripe.cmd listen --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed" --forward-to http://localhost:4000/api/payments/webhook
```

4. Put the listener’s signing secret in `STRIPE_WEBHOOK_SECRET` and restart the backend. Keep the listener running during the test.
5. Sign in as a vendor and open **Dashboard → Subscription → Upgrade to Premium**.
6. Use Stripe’s test card `4242 4242 4242 4242`, a future expiry date, and any three-digit CVC.
7. Verify that the webhook endpoint returns a successful response, the vendor dashboard shows **Premium**, and the admin transaction history shows **Paid**. Test the cancel flow separately.

The backend verifies the Stripe signature and matches each payment to the correct vendor order. The success page displays the recorded payment status. Free vendors can publish up to three active services. During a valid paid period, the same vendor can switch to Free and restore Premium without a new Checkout session. Automatic renewal is managed separately.

### Images and ImgBB

WedPlan accepts JPEG, PNG, WebP, and AVIF images up to **5 MB**. The backend converts uploads to WebP and stores the bytes in MongoDB GridFS.

To enable external mirroring, get an API key from the [ImgBB API page](https://api.imgbb.com/), set `IMGBB_API_KEY` in `backend/.env`, and restart the backend. A successful mirror records its URL in the GridFS file’s `metadata.hostedUrl`. GridFS continues serving images if ImgBB is unavailable.

## Main Routes

| Route | Access and purpose |
| --- | --- |
| `/` | Homepage and featured services |
| `/services` | Public catalog with filters and sorting |
| `/services/[id]` | Signed-in service details and customer booking form |
| `/sign-in`, `/sign-up` | Authentication |
| `/profile` | Signed-in profile settings |
| `/dashboard/customer` | Customer bookings and profile |
| `/dashboard/vendor` | Vendor services, booking requests, profile, and subscription |
| `/dashboard/admin` | Admin users, service moderation, and transactions |
| `/payment/success`, `/payment/cancel` | Vendor Checkout return pages |

| API group | Purpose |
| --- | --- |
| `/health` | MongoDB connectivity check |
| `/api/auth/*` | Authentication, sessions, and JWT |
| `/api/services`, `/api/services/:id` | Catalog and protected service details |
| `/api/profile`, `/api/dashboard` | Authenticated profile and role-specific data |
| `/api/vendor/services/*` | Vendor listing management |
| `/api/bookings/*` | Booking requests and decisions |
| `/api/admin/*` | User and listing moderation |
| `/api/uploads`, `/api/images/:id` | Image uploads and delivery |
| `/api/payments/*` | Checkout, payment status, and subscription management |
| `/api/payments/webhook` | Signature-verified Stripe events |

## Testing

Run the frontend production build from `frontend`.

```powershell
npm.cmd run build
npm.cmd start
```

Run the backend test suite from `backend`.

```powershell
npm.cmd test
```

To include the MongoDB API integration tests, provide a disposable replica set URI.

```powershell
$env:WEDPLAN_TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/?replicaSet=rs0"
npm.cmd test
```

The integration test creates and removes its own test database. It covers authentication, role restrictions, bookings, moderation, image uploads, and Stripe webhook processing.

## Deploy Both Services on Vercel

This deployment uses [Vercel Services](https://vercel.com/docs/services) and a single public domain. The root [`vercel.json`](vercel.json) sends `/api/*` and `/health` to Express and all other paths to Next.js. Both services are built from their own package roots.

1. Import this repository in Vercel with **Root Directory** set to `./` and **Application Preset** set to **Services**.
2. Set `NEXT_PUBLIC_WEDPLAN_MODE=services` and add `MONGODB_URI`, `MONGODB_DB`, and `BETTER_AUTH_SECRET` in the Production environment. Allow the deployed API to reach the Atlas cluster.
3. Use the site's stable production origin for `FRONTEND_URL`, `BETTER_AUTH_URL`, and `PUBLIC_API_URL`. If these are unset, the API uses Vercel's `VERCEL_PROJECT_PRODUCTION_URL` when that system variable is available. Explicit values are useful for a custom origin. Keep `WEDPLAN_BACKEND_URL` empty in Services mode.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google Sign-In, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` for the Stripe sandbox, and `IMGBB_API_KEY` for optional mirroring. Save provider credentials as private environment values.
5. Register the stable production origin's `/api/auth/callback/google` in Google Cloud and its `/api/payments/webhook` in Stripe. Use that new hosted webhook's signing secret.
6. Deploy and test `/health`, `/api/services`, sign-in and dashboard refresh, image upload, and a Stripe sandbox checkout with webhook delivery.

Vercel Services mode accepts images up to 4 MB per upload to fit the [Vercel Functions request limit](https://vercel.com/docs/functions/limitations#request-body-size). The separate Node or Render backend accepts images up to 5 MB.

## Deploy from This Repository

Connect both hosting projects to the `main` branch of this repository.

| Setting | Render API | Vercel frontend |
| --- | --- | --- |
| Root Directory | `backend` | `frontend` |
| Runtime or preset | Node Web Service | Next.js |
| Install or build command | `npm ci` | Install with `npm ci`, build with `npm run build` |
| Start command | `npm start` | Managed by Vercel |
| Health check | `/health` | Load the homepage and request `/api/services` |

### Render

1. Import the root [`render.yaml`](render.yaml) as a Blueprint or create a Node Web Service using the table above. The Blueprint sets Node.js 22.
2. Set `MONGODB_URI` and `MONGODB_DB`, and allow the Render service to reach your MongoDB replica set. Use a private Better Auth secret. When creating a new service, the Blueprint can generate one.
3. Set `PUBLIC_API_URL` to the Render HTTPS origin. Set both `FRONTEND_URL` and `BETTER_AUTH_URL` to the Vercel HTTPS origin. If you create Render first, update the frontend values as soon as the Vercel project URL is assigned.
4. Save Google OAuth and Stripe sandbox credentials in Render. Set `IMGBB_API_KEY` if you use ImgBB mirroring. Verify that the deployed `/health` endpoint returns `status: ok`.

### Vercel

1. Import this repository, set **Root Directory** to `frontend`, and choose the **Next.js** framework preset.
2. Set `NEXT_PUBLIC_WEDPLAN_MODE=proxy` and `WEDPLAN_BACKEND_URL` to the Render HTTPS origin. Leave the direct API and auth overrides blank in proxy mode.
3. Deploy or redeploy after changing the environment variables. Open the frontend and confirm that the catalog loads through the `/api/*` proxy.

### Production Checks

- Add the Vercel HTTPS origin and the exact callback `<FRONTEND_URL>/api/auth/callback/google` to the Google Web OAuth client.
- Register `<PUBLIC_API_URL>/api/payments/webhook` in the Stripe sandbox and select the events from the Stripe section above. Set `STRIPE_WEBHOOK_SECRET` to the signing secret of that hosted endpoint.
- To seed evaluation accounts, run the backend seed commands from a trusted terminal using the intended production database and private seed credentials. Keep the database connection string, OAuth secrets, Stripe keys, ImgBB key, and seed passwords in private environment settings.
- Verify email and Google sign-in, refresh a private dashboard, and confirm the evaluator can access the Admin dashboard. Test bookings, image uploads, Stripe success and cancel, hosted webhook delivery, and the resulting vendor plan.

See the [Render Blueprint reference](https://render.com/docs/blueprint-spec) and [Vercel monorepo guide](https://vercel.com/docs/monorepos).

## Assignment Submission

- Use the separate client and server repositories listed above for the assignment. The combined repository is available for deployment.
- Verify at least 20 meaningful client commits and 12 meaningful server commits in their respective repositories.
- Fill in the live frontend and API links after deployment.
- Share the evaluation admin credentials through the private submission channel.

### Evaluation Details

- Admin email:
- Admin password (private submission only):
- Additional evaluation instructions:
