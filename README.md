# WedPlan Backend

WedPlan is a wedding services marketplace for Bangladesh. This backend provides authentication, role-based authorization, service listings, booking requests, profile uploads, and Stripe test subscriptions.

**Author** — Faruk Ahmed  
**Assignment** — Assignment 9 · Category 004

## Project Links

- Live backend API:
- Live frontend website:
- Backend GitHub repository: https://github.com/srfarukahmed/WedPlan-Server-Side
- Frontend GitHub repository: https://github.com/srfarukahmed/WedPlan-Client-Side

## Key Features

- **Authentication** with Better Auth, email and password, and Google OAuth.
- **Server-side authorization** with JWT and session verification, role restrictions, blocked-account checks, and resource ownership checks.
- **Service management** with vendor listing creation, editing, and deletion, plus admin review and approval. The public catalog shows approved, active listings.
- **Booking requests** with pending, accepted, rejected, and cancelled states. Customers can cancel pending requests. Vendors can accept or reject requests for their own listings.
- **Vendor subscriptions** with Stripe Checkout in test mode. Free vendors can publish up to three active services. Premium vendors can publish unlimited active services.
- **Verified payment processing** with Stripe webhook signature checks, transaction history, and subscription expiry handling.
- **Profile and service images** with server-side validation, WebP conversion, MongoDB GridFS storage, and an ImgBB mirror when configured.
- **Admin tools** for user blocking, service moderation, and read-only transaction history.

## Technology Stack

| Technology | Purpose |
| --- | --- |
| Node.js 22+, JavaScript, Express 5 | HTTP API and application logic |
| MongoDB and GridFS | Business records, authentication data, and image bytes |
| Better Auth and JOSE | Sessions, Google OAuth, and JWT verification |
| Zod | Server-side validation |
| Stripe Checkout and webhooks | Test subscriptions and payment verification |
| Sharp and ImgBB | Image processing and optional external mirroring |
| Node.js test runner | Unit and API integration tests |

## Project Structure

| Path | Contents |
| --- | --- |
| `src/server.js` | Server startup and shutdown |
| `src/app.js` | Express application, middleware, and API registration |
| `src/auth.js` | Better Auth configuration and protected-route middleware |
| `src/db.js` | MongoDB connection, collections, and indexes |
| `src/images.js` | Image processing, GridFS, and ImgBB integration |
| `src/routes/marketplace.js` | Catalog, profiles, bookings, dashboards, and moderation |
| `src/routes/payments.js` | Checkout, subscription management, and webhooks |
| `scripts/seed.js` | Evaluation account and optional catalog setup |
| `seed-assets/` | Images used by the catalog seed |
| `test/` | Unit and integration tests |
| `.env.example` | Backend environment template |

## Installation

Use **Node.js 22 or later**, **npm**, and **MongoDB Atlas** or a local MongoDB replica set. WedPlan uses MongoDB transactions for business operations.

Open PowerShell in the `backend` folder and install dependencies.

```powershell
npm.cmd ci
```

If `.env` does not exist, create it from the template.

```powershell
Copy-Item .env.example .env
```

For MongoDB Atlas, create a database user, allow your development IP under **Network Access**, and copy the application connection string into `MONGODB_URI`.

Generate a Better Auth secret and copy the output into `BETTER_AUTH_SECRET`.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Environment Variables

Use these local settings in `backend/.env`. Fill the empty credential values for the integrations you intend to use.

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

| Setting | Purpose |
| --- | --- |
| `MONGODB_URI`, `MONGODB_DB` | MongoDB connection and database name |
| `FRONTEND_URL` | Allowed frontend origin and Stripe return URL origin |
| `PUBLIC_API_URL` | Public API origin used in uploaded image URLs |
| `BETTER_AUTH_URL` | Browser-facing auth origin. Use the frontend origin in proxy mode. |
| `BETTER_AUTH_SECRET` | Private authentication secret of at least 32 characters |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Web OAuth credentials |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Test API key, recurring test price, and webhook signing secret |
| `IMGBB_API_KEY` | Enables ImgBB mirroring for new image uploads |
| `FARUK_*_EMAIL`, `FARUK_*_PASSWORD` | Private credentials used by the account seed command |

Keep credential values in the private `.env` file or the hosting provider’s environment settings. Commit only `.env.example` with placeholders.

## Run the Backend Only

After setting `MONGODB_URI` and `BETTER_AUTH_SECRET`, start the API.

```powershell
npm.cmd run dev
```

Check the API from a second terminal.

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/api/services
```

`/health` should return `status: ok`. An empty catalog is expected on a fresh database until listings are seeded or approved. You can run these checks with the frontend stopped.

To run the backend without watch mode, use:

```powershell
npm.cmd start
```

### Seed Evaluation Accounts and Demo Listings

Fill in the admin email and password in `.env`. Add vendor and customer credentials if you want to create those accounts as well.

```powershell
npm.cmd run seed
```

To include six approved sample services, set the vendor credentials and use:

```powershell
npm.cmd run seed -- --catalog
```

The seed preserves passwords for existing accounts. Use private evaluation credentials. Public sign-up allows Customer and Vendor accounts.

## Google Sign-In

1. Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/auth/clients).
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
4. Save the client ID and secret in the backend `.env`. If the consent screen is in testing mode, add the intended Google account under test users.
5. Restart the backend. Open the frontend and use **Continue with Google**.

New Google users receive the Customer role. For production, add the equivalent callback under the deployed frontend origin and set `BETTER_AUTH_URL` to that origin.

## Stripe Checkout and Webhooks

1. In a Stripe sandbox, create an active recurring price for WedPlan Premium.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` from that sandbox.
3. Start the Stripe CLI listener in a separate PowerShell terminal.

```powershell
stripe listen --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed" --forward-to http://localhost:4000/api/payments/webhook
```

4. Copy the listener’s signing secret into `STRIPE_WEBHOOK_SECRET`, then restart the backend. Keep the listener open during checkout.
5. Sign in to WedPlan as a vendor. Open **Dashboard → Subscription → Upgrade to Premium**.
6. Use Stripe’s test card `4242 4242 4242 4242`, a future expiry date, and any three-digit CVC. Confirm the webhook receives a successful response, the vendor dashboard shows **Premium**, and the admin transaction history shows **Paid**.

The browser success page displays the recorded payment status. A verified Stripe webhook processes the payment and activates new Premium access. During a valid paid period, a vendor can switch to Free and restore Premium without a new Checkout session. Automatic renewal is managed separately.

## Image Uploads

WedPlan accepts JPEG, PNG, WebP, and AVIF images up to **5 MB**. The backend converts accepted uploads to WebP and saves the file bytes in GridFS.

To enable ImgBB, get a key from the [ImgBB API page](https://api.imgbb.com/), set `IMGBB_API_KEY`, and restart the backend. A successful mirror stores its URL in the GridFS file’s `metadata.hostedUrl`. GridFS continues serving the original upload if ImgBB is unavailable.

## API Overview

| Route group | Access and purpose |
| --- | --- |
| `/health` | Public MongoDB connectivity check |
| `/api/auth/*` | Better Auth registration, sign-in, OAuth, sessions, and tokens |
| `/api/services` | Public approved and active service catalog |
| `/api/services/:id` | Signed-in service details |
| `/api/profile`, `/api/dashboard` | Authenticated profile and role-specific dashboard data |
| `/api/uploads`, `/api/images/:id` | Validated image uploads and GridFS delivery |
| `/api/vendor/services/*` | Vendor-owned listing management |
| `/api/bookings/*` | Customer booking requests and vendor decisions |
| `/api/admin/*` | Admin-only user and listing moderation |
| `/api/payments/*` | Vendor Checkout, plan status, and subscription changes |
| `/api/payments/webhook` | Stripe events verified by signature |

## Testing

Run the backend test suite.

```powershell
npm.cmd test
```

To include the API integration suite, use a disposable MongoDB replica set.

```powershell
$env:WEDPLAN_TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/?replicaSet=rs0"
npm.cmd test
```

Replace the example URI with your test replica set URI. The suite creates and removes its own test database. It covers role restrictions, booking transitions, listing moderation, GridFS uploads, and signed Stripe webhook processing.
