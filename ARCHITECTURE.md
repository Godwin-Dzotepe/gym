# Oracle Gym (QYM) App - Codebase Architecture Analysis

Based on my analysis of the `qym-app` repository, here is a detailed breakdown of the application's architecture, data model, and technology stack.

## 1. Technology Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript
- **Database**: MySQL, managed via Prisma ORM (`@prisma/client` ^5.22.0)
- **Authentication**: NextAuth.js (`next-auth` v5 beta)
- **Styling**: Tailwind CSS v4 with `clsx` and `tailwind-merge`
- **UI & Animations**: `framer-motion`, `lucide-react`, standard Radix/Shadcn-like UI components
- **State Management**: Zustand
- **Charting**: Recharts
- **Emails & SMS**: Nodemailer for emails and MNotify API integration (`mnotify.ts`) for SMS
- **Utilities**: `date-fns` for date manipulation, `pdf-parse` & `pdfjs-dist` for PDF handling.

## 2. Directory Structure

The application follows a standard Next.js App Router structure with logically separated domains:

- `src/app/`
  - `(auth)/`: Authentication routes (login, registration).
  - `api/`: Backend API routes handling client requests.
  - `dashboard/`: The main administrative interface for staff and super admins.
  - `kiosk/`: A specialized interface for gym members to self-check-in (likely using PINs or QR codes).
  - `portal/`: A member-facing portal for viewing memberships, payments, and progress.
- `src/components/`
  - Highly modularized UI component folders: `billing`, `dashboard`, `forms`, `layout`, `members`, `messages`, `notifications`, `portal`, `pos`, `providers`, `settings`, `shared`, `ui`.
- `src/lib/`
  - `auth.ts`: NextAuth configuration and session handling.
  - `prisma.ts`: Prisma client singleton instantiation.
  - `mnotify.ts` / `email.ts`: Integrations for communication.
  - `currency.ts` / `utils.ts`: Helper utilities.
- `prisma/`
  - `schema.prisma`: The central database schema file.
  - `seed.ts`: Database seeding script.

## 3. Database Schema Overview

The `schema.prisma` is exceptionally comprehensive, covering almost every aspect of gym management:

### Core Users & Staff
- `User`: Handles authentication credentials and role-based access (`SUPER_ADMIN`, `STAFF`, `MEMBER`).
- `Staff`: Links to a `User` and tracks staff details and employment.
- `GymSettings`: Global configuration table controlling features (POS, Zoom, Portal, etc.), billing settings, and notification templates.

### Members & Plans
- `Member`: Detailed member records including balances, waivers, emergency contacts, and gym types (Fitness, Martial Arts, Yoga, etc.).
- `Family` & `FamilyMember`: Supports grouped memberships and shared billing.
- `Plan` & `MemberPlan`: Manages the available gym subscriptions and the specific instances of those subscriptions attached to members (including freezes and cancellations).

### Billing & POS
- `Invoice`, `Payment`, `RecurringPayment`: Handles the financial lifecycle, including taxes, discounts, late fees, and recurring billing cycles.
- `Product`, `Sale`, `SaleItem`: A built-in Point of Sale (POS) system for selling merchandise or drop-in sessions.

### Scheduling & Attendance
- `Class` & `ClassBooking`: Scheduling system for recurring or one-off classes, including capacities and Zoom integrations.
- `Attendance`: Tracks member check-ins (PIN, QR, Barcode, Manual).

### Specialized Features
- **CRM / Leads**: Tracks potential members (`Lead`, `LeadActivity`) through the sales funnel.
- **Belt Ranks**: Specific to Martial Arts (`BeltRank`, `MemberRank`), tracking progression.
- **Content Library**: Restricts access to digital content (`ContentItem`, `ContentAccess`) based on rank or plan.
- **Messaging & Notifications**: In-app notifications and external messaging history (`Message`, `MemberMessage`).

## 4. Key Workflows & Features

1. **Multi-Interface Access**: The app splits concerns perfectly. Staff manage the gym through `/dashboard`, members manage their accounts through `/portal`, and the front desk runs the `/kiosk` for check-ins.
2. **Role-Based Access Control (RBAC)**: Enforced via the `User.role` enum, ensuring staff and members only see relevant data.
3. **Comprehensive Communication**: Built-in support for both email and SMS templates, especially for automated triggers like failed payments or expiring memberships (managed in `GymSettings`).
4. **Flexible Billing**: Supports standard recurring plans, daily/weekly plans, one-time fees, and family discounts.

## 5. Potential Areas of Interest
- **PDF Generation/Parsing**: The presence of `pdf-parse` and `pdfjs-dist` suggests features for handling waivers or generating member reports.
- **Next.js 16 App Router**: The app uses the latest Next.js features, meaning it relies heavily on Server Components and Server Actions for data fetching and mutations, keeping the client bundle lean.
