# WedPlan Frontend

WedPlan is a wedding services marketplace for Bangladesh. Customers can discover services and request bookings, vendors can manage listings and subscriptions, and administrators can moderate the marketplace.

**Author** — Faruk Ahmed  
**Assignment** — Assignment 9 · Category 004

## Project Links

- Live website:
- Frontend GitHub repository: https://github.com/srfarukahmed/WedPlan-Client-Side
- Backend GitHub repository:
- Backend API URL:

## Key Features

- **Homepage** with a wedding-themed hero, search, six featured services when available, category links, and an overview of how WedPlan works.
- **Service catalog** with keyword search, category and location filters, maximum budget, and price sorting in both directions.
- **Service details** with a photo gallery, vendor information, and a booking form for signed-in customers.
- **Authentication** with email and password, Google Sign-In when configured, role-based dashboards, and session persistence after refresh.
- **Customer dashboard** for tracking bookings, cancelling pending requests, and editing profile details.
- **Vendor dashboard** for listing management, approval status, booking decisions, and Free or Premium subscriptions.
- **Admin dashboard** for account management, service moderation, and read-only transaction history.
- **Payment screens** for Stripe Checkout success and cancellation. The success screen checks the payment status reported by the backend.
- **Responsive interface** with persistent light and dark modes, reduced-motion support, loading and empty states, and toast notifications.

## Technology Stack

| Technology | Purpose |
| --- | --- |
| Next.js App Router, React, JavaScript | Routing and application UI |
| Tailwind CSS and shadcn/ui | Styling and reusable components |
| Motion | Homepage animations |
| Better Auth client | Authentication and session handling |
| Lucide React | Interface icons |
| Sonner | Toast notifications |

## Project Structure

| Path | Contents |
| --- | --- |
| `app/` | Application routes, layouts, and styles |
| `components/` | Page sections, forms, dashboards, and reusable UI |
| `lib/` | API client, demo data, and frontend configuration |
| `public/` | Logo and bundled images |
| `.env.example` | Frontend environment template |
| `next.config.mjs` | Next.js configuration and API rewrites |

## Installation

Use **Node.js 22** and **npm**. Open PowerShell in the frontend folder and install dependencies.

```powershell
npm.cmd ci
```

### Run the Frontend Only

Demo mode runs in the browser with sample data and role shortcuts. It requires no Express server, MongoDB connection, Google credentials, or Stripe keys. Payments in demo mode are simulated.

If `.env.local` already exists, open it and set the following values. If it does not exist, create it in the frontend folder.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=demo
WEDPLAN_BACKEND_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
```

Start the frontend.

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). On the **Sign In** page, use the **Customer**, **Vendor**, or **Admin** demo button. Restart the frontend after changing `.env.local`.

### Connect to the Backend

For real accounts, MongoDB-backed listings, Google Sign-In, image uploads, and Stripe test Checkout, use proxy mode with a running WedPlan backend.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=proxy
WEDPLAN_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
NEXT_PUBLIC_FARUK_CONTACT_EMAIL=faruk@wedplan.com
NEXT_PUBLIC_FARUK_SOCIAL_URL=https://www.instagram.com/md___faruk_ahmed/
```

- `WEDPLAN_BACKEND_URL` is the Express API origin. Next.js forwards browser requests under `/api/*` to this origin.
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_AUTH_URL` are direct-connection overrides. Leave them blank in proxy mode.
- The contact email and social URL are public footer values.
- Keep MongoDB, Better Auth, Google OAuth, Stripe, and ImgBB secrets in the backend environment.

## Routes and Access

| Route | Access |
| --- | --- |
| `/`, `/services`, `/sign-in`, `/sign-up` | Public |
| `/services/[id]` | Signed-in users. Booking submission requires the Customer role. |
| `/profile` | Signed-in users |
| `/dashboard/customer` | Customers |
| `/dashboard/vendor` | Vendors |
| `/dashboard/admin` | Administrators |
| `/payment/success`, `/payment/cancel` | Vendors returning from Checkout |

The frontend guides users to the appropriate pages. The backend also validates sessions, roles, and resource ownership for protected API requests.

## Assignment Requirements

| Requirement | Frontend implementation |
| --- | --- |
| Responsive wedding-themed UI | Mobile, tablet, and desktop layouts with shared navigation and theme controls |
| Homepage sections | Hero, featured listings, service categories, benefits, and how it works |
| Browse and advanced search | Keyword, category, location, budget, and ascending or descending price sort |
| Authentication and role separation | Registration, sign-in, protected routes, and role-specific dashboards |
| Booking workflow | Request a booking, track its status, and show actions permitted for each role |
| Subscription and payment | Free and Premium plan UI, Checkout and return screens, and confirmation when switching plans |
| Feedback and states | Loading indicators, empty states, validation messages, and toast notifications |



## Production Build and Deployment

Run a production build locally.

```powershell
npm.cmd run build
npm.cmd start
```

For Vercel, use the **Next.js** preset. Select the repository root if this is a standalone frontend repository. Select `frontend` as the Root Directory if both apps share one repository. Set `NEXT_PUBLIC_WEDPLAN_MODE=proxy` and set `WEDPLAN_BACKEND_URL` to your deployed backend's HTTPS origin. Redeploy after updating environment variables.

- Vercel project URL:
- Production frontend URL:
- Production backend API origin: