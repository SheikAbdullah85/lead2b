# lead2b — Event Lead Capture & Sales Engagement Platform

**lead2b** is a simple, ultra-fast, affordable, and mobile-first lead capture and retrieval SaaS platform designed for exhibitions, trade shows, conferences, roadshows, and corporate events (such as GITEX Global, CES, MWC, and Arab Health).

It empowers exhibitors and booth representatives to scan visitor QR badges, capture business cards, record voice notes, qualify leads with custom conditional branching forms, work 100% offline in crowded exhibition venues, and synchronize seamlessly with enterprise CRMs (Salesforce, HubSpot, Zoho, MS Dynamics, and custom webhooks).

---

## 🚀 Key Highlights & Architectural Priorities

1. **Ultra-Fast Lead Capture:** Scan $\rightarrow$ Profile $\rightarrow$ Qualify $\rightarrow$ Save within 5–10 seconds.
2. **Reliable Offline-First Engine:** Powered by **IndexedDB through Dexie.js** and Service Workers. Sales reps can capture hundreds of leads without internet connectivity.
3. **Idempotent Background Synchronization:** Exponential backoff, unique UUID idempotency keys to eliminate duplicates, and visual counters (`Synced: X`, `Pending: Y`, `Failed: Z`).
4. **Strict Multi-Tenant Row-Level Security (RLS):** Built into PostgreSQL. Exhibitors can never query or read another tenant's records.
5. **Independent CRM Layer:** Decoupled architecture with custom field mappings and outbound HMAC-SHA256 signed webhooks.
6. **Commercial SaaS Ready:** Per-event license management (seats, event limit, lead ceilings).
7. **White-Label Ready:** Tenant-level customizable branding (logo, primary color, secondary color, welcome message) applied dynamically across client devices.

---

## 🛠 Technology Stack

- **Frontend & App Router:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **PWA & Offline Storage:** HTML5 Service Worker (`/public/sw.js`), Dexie.js (IndexedDB)
- **Scanning & Media:** HTML5 Camera Scanner (`html5-qrcode`), Web Audio API synthesized feedback, client-side canvas compression for business cards (~250–450 KB), Web MediaRecorder for voice notes
- **Import & Export:** SheetJS (`xlsx`) for CSV/XLSX bulk attendee imports and multi-tab lead reports
- **Backend & Database:** Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage)
- **Hosting & CI/CD:** Cloudflare Pages (Frontend edge) + Supabase (Database/Auth/Storage)

---

## 📁 Directory Structure

```text
lead2b/
├── public/
│   ├── icons/                  # PWA application icons (192x192, 512x512, SVG)
│   ├── manifest.json           # Web App Manifest for mobile installation
│   ├── offline.html            # Standalone offline fallback screen
│   └── sw.js                   # Service Worker with precaching & network-fallback
├── supabase/
│   ├── migrations/
│   │   └── 20260928000000_lead2b_complete_schema.sql  # 26 tables, indexes, RLS policies
│   └── seed.sql                # Pre-seeded GITEX 2026 event, exhibitors, attendees, leads
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Auth & Branding context
│   │   ├── page.tsx            # Interactive portal selector & product overview
│   │   ├── globals.css         # Tailwind & dynamic branding CSS variables
│   │   ├── login/page.tsx      # Multi-role authentication & 1-click persona logins
│   │   ├── invite/[code]/      # Sales rep booth onboarding via QR or invite link
│   │   ├── app/                # Sales Representative Mobile PWA
│   │   │   ├── layout.tsx      # Mobile container with OfflineBanner & bottom nav
│   │   │   ├── dashboard/      # Daily stats, large SCAN LEAD button, recent feed
│   │   │   ├── scan/           # Camera QR scanner, attendee lookup, 5-sec qualification
│   │   │   ├── leads/          # Mobile leads list with search and temperature pills
│   │   │   ├── lead/[id]/      # Lead profile, call/email/whatsapp, voice notes, tasks
│   │   │   ├── lead/new/       # Fast manual lead entry form
│   │   │   ├── lead/card/      # Business card camera capture + client downscale
│   │   │   ├── followups/      # Scheduled follow-up tasks & completion toggles
│   │   │   └── settings/       # Rep profile & IndexedDB sync health diagnostics
│   │   ├── exhibitor/          # Exhibitor Administration Portal
│   │   │   ├── layout.tsx      # Portal header with company logo & event badge
│   │   │   ├── dashboard/      # Booth lead velocity by hour, team leaderboard
│   │   │   ├── leads/          # Full company leads table, filters, Excel/CSV export
│   │   │   ├── team/           # Booth team member licenses, invite links & Join QR
│   │   │   ├── forms/          # Custom form builder with conditional logic engine
│   │   │   ├── reports/        # Executive commercial reports & pipeline breakdown
│   │   │   ├── integrations/   # CRM field mappings & HMAC-SHA256 webhooks
│   │   │   └── settings/       # White-label tenant branding & color picker
│   │   ├── admin/              # Event Organizer & Super Admin Portal
│   │   │   ├── layout.tsx      # Organizer admin header
│   │   │   ├── dashboard/      # Cross-event telemetry, exhibitor adoption metrics
│   │   │   ├── events/         # Multi-event management, halls, and booth allocation
│   │   │   ├── exhibitors/     # Exhibitor tenant directory & license quotas
│   │   │   ├── attendees/      # Bulk Excel/CSV attendee import wizard & validation
│   │   │   ├── licenses/       # Commercial SaaS per-event package issuing
│   │   │   └── audit/          # Compliance audit trail & security activity logs
│   │   └── api/                # REST endpoints
│   │       ├── leads/          # GET / POST with duplicate check
│   │       ├── leads/[id]/     # Lead retrieve and patch
│   │       ├── events/         # Event operations
│   │       ├── attendees/      # Search and badgeId lookups
│   │       ├── followups/      # Task management
│   │       ├── sync/           # Offline queue receiver with idempotency verification
│   │       └── webhooks/       # Webhook testing and management
│   ├── components/
│   │   ├── ui/                 # Button, Input, Card, Badge, Modal, RoleSwitcher
│   │   ├── pwa/                # OfflineBanner, ServiceWorkerRegister
│   │   ├── scanner/            # QrScannerView with Html5Qrcode
│   │   ├── forms/              # QuickQualifyForm, Conditional form preview
│   │   ├── audio/              # VoiceRecorder with MediaRecorder API
│   │   ├── image/              # BusinessCardScanner
│   │   └── layout/             # MobileBottomNav, PortalHeader, ActivityTimeline
│   └── lib/
│       ├── types.ts            # Domain TypeScript models
│       ├── db/
│       │   ├── dexie.ts        # IndexedDB offline database definition
│       │   └── sync-engine.ts  # Background synchronization engine
│       ├── auth/context.tsx    # Multi-role authentication provider
│       ├── branding/context.tsx# Tenant white-label theme provider
│       ├── crm/                # CRM field mapper & HMAC webhook dispatcher
│       └── utils/              # Canvas compression, Excel export, sound synthesizer
├── scripts/
│   ├── generate-icons.js       # PWA icons generator
│   └── run-tests.js            # Automated unit and integration test runner
└── .env.example                # Environment variables template
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.15)
- npm 9+

### 2. Installation
```bash
git clone https://github.com/your-org/lead2b.git
cd lead2b
npm install
```

### 3. Run Automated Tests
```bash
node scripts/run-tests.js
```
*Executes unit validation, CRM transformations, offline sync idempotency, and attendee import checks.*

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or mobile device.

---

## 🎭 Role Switcher & Pre-configured Demo Accounts

For demonstration and testing, `lead2b` features an instant **Floating Role Switcher** at the top right of the screen:

| Persona | Demo Email | Portal Route | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Sales Representative** | `tariq@alphatech.com` | `/app/dashboard` | 5-sec QR badge scanner, offline Dexie queue, business card camera, voice notes |
| **Exhibitor Admin** | `exhibitor@alphatech.com` | `/exhibitor/dashboard` | Lead velocity by hour, Excel export, custom form builder, CRM sync |
| **Event Organizer** | `organizer@gitex.com` | `/admin/dashboard` | Multi-event oversight, hall/booth allocation, Excel attendee bulk import |
| **Super Administrator** | `admin@lead2b.com` | `/admin/dashboard` | System-wide tenant onboarding, SaaS license quota management, audit logs |

---

## 🗄 Database Setup & Supabase Migrations

### 1. Apply Schema Migration
Run the SQL migration in your Supabase SQL Editor:
```bash
supabase/migrations/20260928000000_lead2b_complete_schema.sql
```
*Creates all 26 tables, foreign keys, cascade rules, composite indexes, trigger functions, and PostgreSQL Row-Level Security (RLS) policies.*

### 2. Seed Realistic Demo Data
Run the SQL seed script:
```bash
supabase/seed.sql
```
*Seeds GITEX Global 2026, Alpha Technology Group, booths, attendees, pre-configured qualification forms with conditional questions, sample leads, and licenses.*

---

## 🔒 Row-Level Security (RLS) Policy Design

Every tenant record includes `tenant_id`:
```sql
-- Leads tenant isolation policy
CREATE POLICY "Leads access policy" ON leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.system_role = 'super_admin'
                OR (p.tenant_id = leads.tenant_id AND (
                    p.system_role = 'exhibitor_admin'
                    OR leads.captured_by = auth.uid()
                    OR leads.assigned_to = auth.uid()
                ))
                OR (p.system_role = 'organizer_admin')
            )
        )
    );
```
- **Sales Reps:** Can only access leads personally captured or assigned to them.
- **Exhibitor Admins:** Can view and export all leads belonging to their tenant organization.
- **Cross-Tenant Access:** Blocked at the PostgreSQL database engine level.

---

## 🔄 Offline Synchronization Engine

When internet access drops in crowded exhibition halls:
1. Leads, notes, and tasks are saved immediately into browser **IndexedDB via Dexie.js**.
2. Items are added to the local `syncQueue` table with a unique `idempotency_key`.
3. The UI shows `Saved Offline — Will Sync Automatically` and the banner reflects: `Pending: X`.
4. As soon as connectivity returns (via `window.addEventListener('online')` or manual tap on **Sync Now**), items are posted to `/api/sync`.
5. The server checks the idempotency key to prevent duplicates, creates the permanent record, and returns the server UUID.
6. The client updates local records to `sync_status = 'synced'`.

---

## 🌐 Production Deployment

### Frontend (Cloudflare Pages or Workers)
1. Push code to GitHub repository (`main` branch for production, `staging` for testing).
2. Connect repository to Cloudflare Pages.
3. Build Settings:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: `.next`
4. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WEBHOOK_SIGNING_SECRET`
   - `NEXT_PUBLIC_APP_URL`

### Backend (Supabase)
1. Create a Supabase project in the region closest to your primary event (e.g. Frankfurt or Bahrain for GCC/GITEX).
2. Execute `supabase/migrations/20260928000000_lead2b_complete_schema.sql`.
3. Create private storage buckets:
   - `business_cards`
   - `voice_notes`
   - `logos`

---

## 💾 Backup & Disaster Recovery Procedure

- **Pre-Event Backup:**
  1. Trigger Supabase manual database dump:
     ```bash
     supabase db dump -f gitex_pre_event_backup.sql
     ```
  2. Export attendee master list as XLSX backup from `/admin/attendees`.
- **Post-Event Archival:**
  1. Trigger complete exhibitor lead export via `/exhibitor/leads` $\rightarrow$ **Export Excel**.
  2. Archive event from `/admin/events`.
- **Client Resilience:** If a device is disconnected or lost, unsynchronized leads persist safely in IndexedDB until synced.

---

## 📄 License & Commercial SaaS Model

Initial commercial release operates under a **Per Event** model:
- **1 Exhibition Event** (e.g. 5 days GITEX)
- **5 to 10 Sales Representative Seats**
- **2,500 to 5,000 Leads Cap**
- **14 to 30 Days Post-Event Cloud Access**

*lead2b is built as an independent, scalable SaaS modular monolith ready for commercial client demonstrations.*
