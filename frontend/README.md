
# WedPlan — Wedding Services Marketplace

A modern, responsive wedding services marketplace built with **Next.js 16**, **React 19**, and **JavaScript**, designed to connect customers with wedding service providers across Bangladesh.

WedPlan provides a unified platform for discovering wedding services, managing bookings, publishing vendor listings, and handling subscription-based features through secure role-based dashboards.

### Project Information

| Information | Details |
|---|---|
| Project | WedPlan |
| Category | Wedding Services Marketplace |
| Assignment | Assignment 9 — Category 004 |
| Author | Faruk Ahmed |
| Frontend | Next.js, React, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | Better Auth, Google OAuth |
| Payment Integration | Stripe |
| Deployment | Vercel |

---

## Live Demo & Repository Links

| Resource | Link |
|---|---|
| Live Website | [WedPlan](https://wedplan-full-stack.vercel.app) |
| Frontend Repository | [WedPlan Client Side](https://github.com/srfarukahmed/WedPlan-Client-Side) |
| Backend Repository | [WedPlan Server Side](https://github.com/srfarukahmed/WedPlan-Server-Side) |

---

## Project Overview

WedPlan is a full-stack wedding services marketplace developed to simplify the process of finding and booking wedding professionals in Bangladesh.

The platform supports three primary user roles:

- **Customers** — Explore services, submit booking requests, and track bookings.
- **Vendors** — Publish and manage services, respond to customers, and manage subscriptions.
- **Administrators** — Manage users, moderate services, and monitor transactions.

The frontend focuses on accessibility, responsive design, smooth navigation, and consistent user experiences across devices.

---

## Key Features

### 1. Interactive Homepage

- Modern wedding-themed hero section.
- Search functionality for wedding services.
- Featured service listings.
- Six wedding service categories.
- Platform benefits and workflow explanations.
- Fully responsive layouts.

### 2. Service Discovery

- Browse available wedding services.
- Search services using keywords.
- Filter by category and location.
- Apply maximum budget filters.
- Sort prices from low to high or high to low.
- View service details and photographs.
- Explore vendor information.

### 3. Authentication & Authorization

- Email and password registration.
- Secure account sign-in.
- Google OAuth authentication.
- Persistent login sessions.
- Protected dashboard routes.
- Role-based navigation and access control.

### 4. Customer Dashboard

Customers can:

- View booking requests.
- Monitor booking statuses.
- Cancel pending booking requests.
- Update profile information.
- Manage account details.

### 5. Vendor Dashboard

Vendors can:

- Create wedding service listings.
- Upload service images.
- Edit and delete listings.
- Monitor service approval statuses.
- Activate or deactivate available services.
- Accept or reject booking requests.
- Manage Free and Premium subscriptions.
- View subscription validity and renewal status.

### 6. Administrator Dashboard

Administrators can:

- View registered users.
- Manage account access.
- Block or unblock users.
- Review submitted services.
- Approve or reject listings.
- Monitor platform transactions.

### 7. Subscription & Payment Integration

- Free and Premium subscription plans.
- Stripe-hosted checkout.
- Payment success and cancellation pages.
- Backend-based payment status verification.
- Subscription validity display.
- Automatic renewal management.
- Premium subscription benefits.

### 8. Responsive User Experience

- Mobile-first responsive layout.
- Light and dark theme support.
- Persistent theme preferences.
- Loading indicators and empty states.
- Form validation and error handling.
- Toast notifications.
- Accessible interface components.
- Reduced-motion support.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application routing and rendering |
| React 19 | Component-based user interface |
| JavaScript | Frontend programming |
| Tailwind CSS 4 | Responsive styling |
| shadcn/ui patterns | Reusable UI components |
| Radix UI | Accessible UI primitives |
| Motion | Interactive animations |
| Better Auth | Authentication integration |
| Lucide React | Interface icons |
| Sonner | Toast notifications |
| Vercel | Production hosting |

### Backend Integration

The frontend communicates with the WedPlan Express backend, which is responsible for authentication, database access, bookings, payment verification, file uploads, and role-based authorization.

---

## Project Folder Structure

```text
frontend/
│
├── app/
│   ├── dashboard/
│   │   └── [[...segments]]/
│   │
│   ├── payment/
│   │   └── [result]/
│   │
│   ├── profile/
│   │   └── page.jsx
│   │
│   ├── services/
│   │   ├── [id]/
│   │   └── page.jsx
│   │
│   ├── sign-in/
│   │   └── page.jsx
│   │
│   ├── sign-up/
│   │   └── page.jsx
│   │
│   ├── error.jsx
│   ├── globals.css
│   ├── home.css
│   ├── icon.png
│   ├── layout.jsx
│   ├── loading.jsx
│   ├── not-found.jsx
│   └── page.jsx
│
├── components/
│   ├── ui/
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   └── input.jsx
│   │
│   ├── account.jsx
│   ├── catalog.jsx
│   ├── dashboard.jsx
│   ├── payment.jsx
│   ├── platform.jsx
│   ├── site.jsx
│   └── theme.jsx
│
├── lib/
│   ├── demo.js
│   ├── platform-mode.js
│   ├── platform.js
│   └── utils.js
│
├── public/
│   ├── photos/
│   └── wedplan-logo.webp
│
├── .env.example
├── .gitignore
├── README.md
├── components.json
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
└── postcss.config.mjs
```

### Directory Responsibilities

| Directory / File | Responsibility |
|---|---|
| `app/` | Next.js pages, layouts, routes, and styles |
| `app/dashboard/` | Role-based dashboard routing |
| `app/services/` | Service catalog and details |
| `app/payment/` | Payment result pages |
| `components/` | Reusable application components |
| `components/ui/` | Shared UI primitives |
| `lib/platform.js` | Frontend platform API integration |
| `lib/platform-mode.js` | Environment and API mode configuration |
| `lib/demo.js` | Demo data and shared utilities |
| `public/` | Static images and brand assets |
| `next.config.mjs` | Next.js settings and API rewrites |
| `.env.example` | Environment variable template |
| `package.json` | Dependencies and npm scripts |

---

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Node.js 22 LTS (recommended)
- npm
- Git
- Visual Studio Code (recommended)

### 1. Clone the Repository

For the standalone frontend repository:

```bash
git clone https://github.com/srfarukahmed/WedPlan-Client-Side.git
cd WedPlan-Client-Side
```

For the full-stack repository:

```bash
git clone https://github.com/srfarukahmed/WedPlan-Full-Stack.git
cd WedPlan-Full-Stack/frontend
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

Create a `.env.local` file in the frontend root directory.

You can use `.env.example` as the configuration reference.

### 4. Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

### 5. Create a Production Build

```bash
npm run build
```

Run the production server locally:

```bash
npm start
```

---

## Environment Configuration

WedPlan supports demo mode and backend-connected operation.

### Demo Mode

Demo mode provides a frontend-only experience with sample data.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=demo
WEDPLAN_BACKEND_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
```

In demo mode:

- No backend server is required.
- No MongoDB connection is required.
- Demo accounts can be used.
- Sample service and booking data are available.
- Payment behavior is simulated.

### Backend-Connected Mode

Use proxy mode when running the frontend with a local Express backend.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=proxy
WEDPLAN_BACKEND_URL=http://localhost:4000

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=

NEXT_PUBLIC_FARUK_CONTACT_EMAIL=faruk@wedplan.com
NEXT_PUBLIC_FARUK_SOCIAL_URL=https://www.instagram.com/md___faruk_ahmed/
```

In this configuration, Next.js forwards `/api/*` requests to the configured Express backend.

### Vercel Multi-Service Deployment

When using WedPlan's multi-service `vercel.json` configuration, the platform can route frontend and backend requests to their respective services.

```dotenv
NEXT_PUBLIC_WEDPLAN_MODE=services

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_AUTH_URL=
```

The `services` mode uses same-origin API paths and relies on the deployment platform's routing configuration.

### Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WEDPLAN_MODE` | Frontend operating mode |
| `WEDPLAN_BACKEND_URL` | Express backend origin for proxy mode |
| `NEXT_PUBLIC_API_URL` | Optional direct API URL |
| `NEXT_PUBLIC_AUTH_URL` | Optional authentication URL override |
| `NEXT_PUBLIC_FARUK_CONTACT_EMAIL` | Public contact email |
| `NEXT_PUBLIC_FARUK_SOCIAL_URL` | Public social media URL |

> **Security Notice:** Never expose database credentials, OAuth client secrets, Stripe secret keys, or authentication secrets through `NEXT_PUBLIC_` environment variables. Keep sensitive configuration on the backend.

---

## Application Routes

### Public Routes

| Route | Description |
|---|---|
| `/` | Homepage |
| `/services` | Browse wedding services |
| `/services/[id]` | Service details |
| `/sign-in` | User authentication |
| `/sign-up` | Account registration |

### Protected Routes

| Route | Description |
|---|---|
| `/profile` | User profile |
| `/dashboard/customer` | Customer dashboard |
| `/dashboard/customer/my-bookings` | Customer bookings |
| `/dashboard/vendor` | Vendor dashboard |
| `/dashboard/vendor/my-services` | Vendor listings |
| `/dashboard/vendor/add-service` | Create service |
| `/dashboard/vendor/booking-requests` | Vendor booking management |
| `/dashboard/vendor/subscription` | Subscription management |
| `/dashboard/admin` | Administrator dashboard |
| `/dashboard/admin/users` | User management |
| `/dashboard/admin/services` | Service moderation |
| `/dashboard/admin/transactions` | Payment transactions |

### Payment Routes

| Route | Description |
|---|---|
| `/payment/success` | Stripe Checkout success |
| `/payment/cancel` | Cancelled checkout |

The backend enforces authentication, permissions, and resource ownership for protected operations.

---

## User Roles & Permissions

| Feature | Customer | Vendor | Admin |
|---|:---:|:---:|:---:|
| Browse services | Yes | Yes | Yes |
| View service details | Yes | Yes | Yes |
| Submit booking request | Yes | No | No |
| Manage personal bookings | Yes | No | No |
| Create services | No | Yes | No |
| Manage vendor listings | No | Yes | Yes |
| Respond to bookings | No | Yes | No |
| Manage subscription | No | Yes | No |
| Approve services | No | No | Yes |
| Manage users | No | No | Yes |
| View transactions | No | No | Yes |

---

## Subscription Plans

### Free Plan

- Up to three active service listings.
- Vendor dashboard access.
- Booking request management.
- Basic listing management.

### Premium Plan

- Unlimited active service listings.
- Premium vendor badge.
- All Free plan features.
- Subscription validity tracking.
- Automatic renewal controls.

Stripe handles subscription checkout, while the backend manages payment verification and subscription status.

---
---

## Deployment

### Vercel Deployment

WedPlan is deployed using Vercel.

**Production Website:**

https://wedplan-full-stack.vercel.app



## Author

**Faruk Ahmed**

Assignment 9 — Category 004

GitHub: https://github.com/srfarukahmed

Email: faruk@wedplan.com

---

## License

No open-source license has been specified for this repository. All rights remain with the respective copyright holder unless a license is added.

---

**WedPlan — Making Wedding Planning Easier Across Bangladesh.**
