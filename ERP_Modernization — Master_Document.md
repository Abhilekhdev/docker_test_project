# ERP Modernization — Master Document
### UltimatePOS-based ERP (Laravel 9 / MySQL) → PERN Stack
**Backend:** Node.js with **NestJS (preferred) / Express.js** · **Database:** PostgreSQL · **Frontend:** React
 
> Prepared for **Olympas LLC**. This document is based on a direct, code-level review of the actual project — controllers, Eloquent models, the `app/Utils` business-logic layer, HTTP middleware, the MySQL dump, and the `.env` / `composer.json` / `config/*` files. Identifiers shown like `business_id` or `transactions` are real names from the codebase/database.
 
---
 
## Table of Contents
 
1. [Target Technology Stack — what we will use & why](#1-target-technology-stack)
2. [Comparison — Laravel + MySQL vs Node (NestJS/Express) + PostgreSQL + React](#2-comparison)
3. [Current System — what is running now + full business logic](#3-current-system--full-business-logic)
4. [Third-Party Dependencies & External Data Sources](#4-third-party-dependencies--external-data-sources)
> **Companion file:** a separate **`ERP_Database_Dictionary.md`** explains all **110 tables column-by-column** (what each key is and why it exists). Use it as the blueprint for the new PostgreSQL/Prisma schema.
 
---
 
# 1. Target Technology Stack
 
The full set of technologies we will use to rebuild the ERP, and exactly what each one is for. The backend framework is **NestJS (preferred) / Express.js** — NestJS is recommended for an enterprise ERP of this size (reasons in Section 2), but Express remains a valid alternative.
 
## 1.1 Backend
 
| Layer | Technology | What it does / why |
|---|---|---|
| Runtime | **Node.js** | JavaScript/TypeScript server runtime; event-driven, non-blocking I/O — efficient for the many concurrent, I/O-bound requests an ERP produces |
| Framework | **NestJS (preferred) / Express.js** | The API layer. NestJS gives opinionated structure (modules, controllers, services, DI) ideal for 110+ tables; Express is the lighter, more flexible alternative |
| Language | **TypeScript** | End-to-end type safety across 110+ tables and heavy business logic — catches field/type errors at compile time |
| ORM | **Prisma** (Sequelize as alt) | Prisma provides type-safe database access, schema management, automated migrations, and excellent TypeScript integration. It simplifies handling complex relationships across 110+ ERP tables while reducing runtime errors and improving developer productivity. Sequelize may be used as an alternative ORM when greater query customization or legacy ORM patterns are required |
| Database | **PostgreSQL** | A modern, open-source, enterprise-grade relational database — a strong default choice today. It is highly reliable and ACID-compliant (safe for financial/ERP data), scales well, and has a rich type system (`boolean`, `enum`, `numeric` for exact money, `jsonb` for flexible data). It offers powerful analytical/reporting features (CTEs, window functions, materialized views), strong data integrity via constraints and real transactions, excellent JSON support, full-text search, and a large, active ecosystem with great tooling (incl. Prisma). It is generally better suited than MySQL for complex queries and reporting-heavy ERP workloads |
| Validation | **Zod / class-validator** | Request/DTO validation at the API boundary (class-validator is built into NestJS) |
| Auth | **JWT (access + refresh tokens)** | Stateless authentication; the token carries `business_id` + permitted locations for multi-tenant scoping. Replaces the current Passport/OAuth2 |
| Authorization | **RBAC + Guards / CASL** | Role + permission checks on every route (replicates the current Spatie permission model) |
| Caching | **Redis** | Caches heavy reports/dashboards, sessions, rate-limit counters |
| Queues / Jobs | **BullMQ + Redis** | Background processing: invoice/payslip PDF generation, Excel import/export, email/SMS, scheduled reports, WooCommerce sync — user does not wait |
| Real-time | **Socket.IO / WebSockets** (NestJS Gateways) | Live stock updates, notifications, approval workflows, live dashboards |
| File storage | **AWS S3 / local disk** | Product images, invoices, payslips, signed documents (abstraction so both work) |
| API docs | **Swagger / OpenAPI** | Self-documenting, testable contract (NestJS has first-class Swagger support) |
| Events | **Event Emitter / Event Bus** (NestJS) | Domain events like "payment added → post to ledger → send notification → write audit log" |
 
## 1.2 Frontend
 
| Layer | Technology | What it does / why |
|---|---|---|
| Framework | **React.js (Vite)** | Single-page app; fast dev server; component reuse across many CRUD + POS screens |
| Styling | **Tailwind CSS** | Utility-first styling for dense ERP UIs, built quickly and consistently |
| Components | **ShadCN UI / Material UI** | Accessible, ready-made inputs, dialogs, tables, dropdowns |
| State | **Redux Toolkit / Zustand** | Global state for cart, session, settings, permissions |
| Server state | **React Query (TanStack Query)** | Data fetching, caching, background refetch — less boilerplate |
| Tables | **TanStack Table** | Replaces DataTables — sorting, paging, filtering on large lists |
| Charts | **Recharts / Chart.js** | Dashboard KPIs and report visualisations |
 
## 1.3 DevOps & Operations
 
| Layer | Technology | What it does / why |
|---|---|---|
| Containers | **Docker** | Reproducible API + DB + Redis environments |
| Deployment | **AWS ECS / EC2** | Scalable hosting for the stateless API |
| CI/CD | **GitHub Actions** | Automated lint, test, build, deploy on each push |
| Monitoring | **Prometheus + Grafana** | Metrics, dashboards, alerts |
| Tracing/Logs | **OpenTelemetry + structured logging** | Request tracing, error tracking, queue monitoring |
 
---
 
# 2. Comparison
 
**Scenario:** building/operating this ERP on **Laravel + MySQL** vs **Node.js (NestJS preferred / Express) + PostgreSQL + React**.
 
## 2.1 Rating Summary
 
> Ratings are indicative, for this ERP's needs (large schema, multi-tenant, future mobile/real-time).
 
| Criteria | Laravel + MySQL | PERN (NestJS/Express + PostgreSQL + React) |
|---|---|---|
| Development Speed | ★★★★★ | ★★★★☆ |
| Scalability | ★★★★☆ | ★★★★★ |
| Modern UI | ★★★☆☆ | ★★★★★ |
| Mobile App Integration | ★★★★☆ | ★★★★★ |
| Type Safety | ★★★☆☆ | ★★★★★ |
| Real-time Features | ★★★☆☆ | ★★★★★ |
| Enterprise Architecture | ★★★★☆ | ★★★★★ |
 
**Reading it honestly:** Laravel wins on raw *development speed* (batteries included — this existing app proves it). PERN wins on *UI, type safety, real-time, scalability, and enterprise architecture*. For a modern, API-first ERP that a JS/TS team owns, PERN is the stronger long-term choice.
 
## 2.2 Why Node.js Here
 
Node.js uses an **Event Loop**, **non-blocking I/O**, and an **async architecture**. Work like:
 
```
Read File   →  
Call API    →   handled concurrently, without blocking threads
Query DB    →
```
 
…runs concurrently instead of blocking a thread per request. For an ERP, most work is I/O-bound (DB queries, file/PDF generation, external API calls), which is exactly where this model shines.
 
### 1) Concurrency
 
Node's event-driven, non-blocking model handles many simultaneous requests efficiently. Example:
 
- 500 users checking inventory
- 200 users generating invoices
- 100 users exporting reports
Node generally handles these concurrent, I/O-bound requests more efficiently (per server) than the traditional PHP/Laravel request-per-process model.
 
### 2) Real-Time ERP Features
 
Likely future requirements:
 
- Live stock updates
- Real-time notifications
- Approval workflows
- Chat
- Live dashboards
- Tracking systems
Node.js is naturally strong here (WebSockets/Socket.IO). Laravel can do it too, but the architecture is less natural.
 
### 3) Microservices Readiness
 
A large ERP eventually splits into services:
 
```
Auth Service · Inventory Service · Sales Service · HR Service · Reporting Service
```
 
The Node ecosystem is very mature for microservices (message queues, event bus, service communication).
 
### 4) PostgreSQL + Prisma + TypeScript
 
Eloquent (Laravel) is good, but **PostgreSQL + Prisma + TypeScript** gives:
 
- Type safety
- Better refactoring
- Better schema management
- Safer large codebases
With **110+ tables**, compile-time type safety becomes very valuable.
 
### 5) Resource Usage
 
Under high concurrency, Node generally consumes less memory and handles more requests per server — particularly for I/O-heavy ERP workloads.
 
### 6) Frontend Architecture
 
**React vs Blade** — React wins by a large margin for dynamic dashboards, complex forms, reusable components, and multi-module ERP UIs.
 
## 2.3 Why NestJS + PostgreSQL is Recommended for Enterprise ERP
 
### 1) Strong Architectural Structure
NestJS is more opinionated than Laravel for enterprise apps: **Modules, Dependency Injection, Service-Layer separation, Clean Architecture, DDD**. A typical module:
 
```
Inventory Module
 ├── Controller   (HTTP)
 ├── Service      (business logic)
 ├── Repository   (data access / Prisma)
 ├── DTO          (validated input/output)
 └── Entity       (model)
```
 
For a 110+ table ERP, this dramatically improves maintainability.
 
### 2) End-to-End Type Safety (TypeScript)
PHP errors often surface at runtime. With NestJS + TypeScript + Prisma:
 
```ts
const user = await prisma.user.findUnique({ where: { id } })
```
 
The compiler catches **wrong field name, wrong data type, missing property** before running. Result: fewer production bugs, safer refactoring, more developer confidence — critical for large business logic.
 
### 3) Better API-First Architecture
A modern ERP isn't only a web app. Future clients: **Mobile App, Vendor Portal, Customer Portal, Accounting software, Payment gateway, Warehouse systems.**
 
```
React ERP
    |
 NestJS API
    |
 PostgreSQL
```
 
The same API serves many clients.
 
### 4) Superior Background Job Processing
Heavy operations — Invoice generation, Excel export, Import processing, Email, Scheduled reports — run on **NestJS + BullMQ**:
 
```
User clicks Export → Job added to Queue → Background worker processes → File generated
```
 
The user doesn't wait.
 
### 5) Horizontal Scaling
Stateless APIs scale simply:
 
```
Load Balancer → API 1 · API 2 · API 3 · API 4
```
 
Suitable for multiple branches, multiple companies, thousands of concurrent users.
 
### 6) Event-Driven Architecture
ERP events are common:
 
```
Purchase Order Approved → Inventory Updated → Notification Sent → Audit Log Created
```
 
NestJS's Event Emitter pattern implements these workflows cleanly.
 
### 7) Advanced Reporting & Analytics
Reporting is usually the heaviest area. PostgreSQL provides **Materialized Views, Window Functions, CTEs, JSONB, advanced indexing** — generally stronger than MySQL for analytical workloads (Monthly Sales Trend, Inventory Aging, Profitability Analysis, Branch-wise KPIs).
 
### 8) Observability & Monitoring
Production ERP needs error tracking, request monitoring, performance metrics, queue monitoring. NestJS integrates cleanly with **Prometheus, Grafana, OpenTelemetry**.
 
### 9) Future Microservices Readiness
As the ERP grows (Auth / Inventory / Sales / HR / Reporting services), NestJS has built-in support for **message queues, event bus, service communication** — enabling gradual migration to microservices.
 
### 10) Enterprise-Grade Security
NestJS supports **JWT auth, RBAC, Guards, Rate Limiting, Request Validation, Audit Logging.** Granular permissions per role:
 
```
Admin · Manager · Sales Executive · Store Manager · Accountant
```
 
## 2.4 Verdict
 
> ## 🏆 Winner: Node.js + PostgreSQL (PERN), backend on **NestJS (preferred) / Express.js**
 
Laravel + MySQL remains an excellent, fast way to build an ERP (this very system proves it). But for a **modern, API-first, type-safe, real-time-ready, horizontally-scalable** ERP owned by a JS/TS team, **PERN with NestJS + PostgreSQL is the recommended target** — and it aligns directly with the team's MERN + PostgreSQL strengths.
 
---
 
# 3. Current System — Full Business Logic
 
## 3.1 What Is Running Now
 
This is a customised **UltimatePOS** build — a mature multi-tenant POS/ERP.
 
| Property | Value |
|---|---|
| Framework | Laravel 9 (PHP 8) |
| Frontend | Blade templates + jQuery + Bootstrap + DataTables (server-rendered) |
| Database | MySQL (InnoDB) — **110 tables** |
| Auth | Laravel Passport (OAuth2) for API + session login; Spatie for roles/permissions |
| Modularity | nWidart Laravel-Modules (`/Modules`) |
| Tenancy | **Multi-tenant, single shared database, scoped by `business_id`** (not database-per-tenant) |
| Business logic | Concentrated in `app/Utils` (`TransactionUtil` ~320 KB, `ProductUtil` ~108 KB, `BusinessUtil`, `ModuleUtil`, …) |
| Active modules | Essentials (HR), Manufacturing, DocumentSign (+ Restaurant features in core) |
 
> **Most important fact:** the real business logic is in the **`app/Utils` layer**, not the controllers. Controllers mostly validate input and call Utils methods. In PERN these Utils become your **service layer**. Port the Utils = port the system.
 
## 3.2 Core Architecture Concepts
 
**A. Business = tenant.** A row in `business` is one company. Almost every table has a `business_id`. Settings are stored as JSON columns on `business` (`enabled_modules`, `ref_no_prefixes`, `email_settings`, `sms_settings`, `common_settings`). Each business has a `currency` and many `business_locations`.
 
**B. Locations.** Stock, sales, purchases and invoice schemes are per-location. A user's location access is stored as Spatie permissions `location.<id>` (or `access_all_locations`), enforced by `User::permitted_locations()` and the `onlyPermittedLocations()` query scope.
 
**C. Users, Roles & Permissions (Spatie).**
- `roles` — role names are namespaced per tenant: `<RoleName>#<business_id>` (e.g. `Admin#15`, `Cashier#15`). Default roles per business: **Admin** (full) and **Cashier**.
- `permissions` — one row per feature action (`product.view`, `sell.create`, `purchase.update`, `essentials.approve_leave`…). Missing permissions auto-created when a role is saved.
- Pivots: `model_has_roles`, `model_has_permissions`, `role_has_permissions`.
- Every action gated by `if (!auth()->user()->can('product.view')) abort(403)`. A role's "responsibility" = the permission set synced to it.
**D. The polymorphic `transactions` table (the heart).** One table represents almost every financial document, distinguished by `type`:
 
| `transactions.type` | Meaning | Child line table |
|---|---|---|
| `sell` | Sale / POS invoice | `transaction_sell_lines` |
| `purchase` | Purchase from supplier | `purchase_lines` |
| `sell_return` / `purchase_return` | Returns | reverses parent lines |
| `expense` | Business expense | — |
| `payroll` | Employee salary run (HR) | `essentials_allowances`/`deductions` (JSON) |
| `stock_adjustment` | Stock correction | `stock_adjustment_lines` |
| `sell_transfer` / `purchase_transfer` | Stock transfer between locations | `transaction_sell_lines` |
| `opening_stock` | Initial stock load | `purchase_lines` |
| `opening_balance` | Customer/supplier starting balance | — |
 
Each transaction also carries `status` (`final`/`draft`/`pending`/`received`…), `payment_status` (`paid`/`partial`/`due`), `business_id`, `location_id`, `contact_id`, and totals (`total_before_tax`, `tax_amount`, `discount_amount`, `final_total`). Money received is recorded in `transaction_payments`.
 
**E. Modules & subscription.** Add-ons under `/Modules` integrate via `ModuleUtil::getModuleData('fn')`, which calls each module's `DataController::fn()` — this is how modules inject form fields (e.g. HR salary fields onto the Add-User screen), menus and permissions. If the **Superadmin** module is installed, `isSubscribed()` / `isQuotaAvailable('users'|'products'|'locations'|'invoices')` enforce SaaS limits per tenant.
 
## 3.3 Functional Walkthroughs (examples)
 
### Creating a user + attaching a role
Screen: User Management → Add User (`ManageUserController@store`, gated by `user.create`).
1. Form collects name, `email`, `username`, `password`, `language`, a **role** dropdown, location checkboxes, `cmmsn_percent`, `max_sales_discount_percent`, plus module-injected fields (HR fields when Essentials is on).
2. `ModuleUtil::createUser()` inserts into `users` with `business_id` from session; password hashed.
3. Role attached via Spatie `assignRole('Manager#'.$business_id)` → `model_has_roles`.
4. Location access stored as `location.<id>` permissions → `model_has_permissions`.
Roles themselves are created in Role Management (`RoleController@store`, `roles.create`): inserts a `roles` row `<name>#<business_id>` and `syncPermissions()` the ticked checkboxes — that permission set is the role's responsibility.
 
### Creating an employee + managing salary (HR / Payroll)
An **employee is a user** with extra HR fields (injected by Essentials).
- HR fields: `essentials_salary`, `essentials_pay_period` (`month`/`week`/`day`), `essentials_department_id` & `essentials_designation_id` (these point into the shared `categories` table with `category_type = 'hrm_department'` / `'hrm_designation'`), `bank_details` (JSON), `parent_id` (manager), leave entitlements in `essentials_user_leave_and_deductions`.
- Payroll (`PayrollController`):
  1. Pick `employee_ids[]` + `month_year`. Base = `essentials_salary ÷ days_in_period × days_worked` (days_worked from `essentials_attendances`).
  2. Add allowances: sales commission (`cmmsn_percent`), sales-target commission (`essentials_user_sales_targets`), claims/reimbursements (`essentials_claim_reimbursement`), assigned `essentials_allowance_and_deductions` (type allowance, `fixed` or `percent`).
  3. Subtract deductions (same table, type deduction). Net = base + allowances − deductions.
  4. Save → one `transactions` row per employee, `type='payroll'`, `payment_status='due'`, `expense_for=employee`; allowance/deduction breakdown stored in JSON `essentials_allowances`/`essentials_deductions`; grouped in `essentials_payroll_groups` via pivot `essentials_payroll_group_transactions`.
  5. Pay → `transaction_payments` against an `account`; payslip PDF; group status `paid`/`partial`/`due`.
> Payroll re-uses `transactions` + `transaction_payments` — a salary run is literally an expense-type transaction. **Note:** gross/net totals are currently computed in the browser and trusted by the server — recompute server-side in PERN.
 
### Product creation
`ProductController@store` → writes `products`, then branches on `type`:
- `single` — one default `variations` row (`default_purchase_price`, `profit_percent`, `default_sell_price`) under a DUMMY `product_variations` group.
- `variable` — a `product_variations` parent per attribute + many child `variations` (each with `sub_sku` + prices).
- `combo` — a sellable bundle of other variations.
If `sku` blank, auto-generated from product id. `tax` (a `tax_rates` id) + `tax_type` stored. **Stock is not created here** — `variation_location_details` rows appear via opening stock or purchase. Extra price tiers go to `selling_price_groups`.
 
### Contact (customer/supplier)
`ContactController@store` → `contacts`. `type` = `customer`/`supplier`/`both`. Captures `opening_balance`, `credit_limit` (null = unlimited), `pay_term_number/type` (credit period), `customer_group_id` (group pricing). Running `balance`/`due` computed from transactions + payments. Credit limit enforced at sale time.
 
### Purchase → stock ↑ → supplier payment
1. Pick supplier (`contact_id`), `location_id`, date, `ref_no`, status `received`/`pending`.
2. Add lines → `transactions` (`type='purchase'`) + `purchase_lines`.
3. If `received`, `ProductUtil::createOrUpdatePurchaseLines()` **increments** `variation_location_details.qty_available`.
4. Supplier payment → `transaction_payments`; `payment_status` recomputed.
### Sale / POS → stock ↓ → payment → invoice
`SellPosController@store` (~207 KB engine):
1. Build cart; choose customer + location; set discount + tax.
2. Status: `final` / `draft` (quotation `is_quotation=1`) / suspended (`is_suspend=1`).
3. Create `transactions` (`type='sell'`) + `transaction_sell_lines`; `invoice_no` from `invoice_schemes`.
4. Only for `final`: **decrement** `variation_location_details.qty_available`. If product has a `mfg_recipes` recipe, ingredient stock is deducted instead; combos deduct components.
5. Take payment: one `transaction_payments` row per tender; change as `is_return` line; advance validated against `contacts.balance`.
6. Sell return = `type='sell_return'` linked via `return_parent_id`, re-increments stock.
### Inventory
Live stock per location = `variation_location_details.qty_available` keyed by (`variation_id`, `product_id`, `location_id`). Purchases ↑, final sales ↓, returns reverse. `purchase_lines` track `quantity_sold`/`returned`/`adjusted` (FIFO costing, mapped via `transaction_sell_lines_purchase_lines`). Stock adjustments (`type='stock_adjustment'` + `stock_adjustment_lines`) and transfers (`sell_transfer`+`purchase_transfer`, with `in_transit`).
 
### Payments & status
Both sells and purchases use `transaction_payments`. `total_paid = Σ payments`; `final_total ≤ total_paid` → `paid`; some paid → `partial`; else `due`. Past `pay_term` → `overdue`. Paying fires `TransactionPaymentAdded` → posts to the `accounts` ledger (`account_transactions`).
 
## 3.4 Additional Backend Logic Still in the System
 
Beyond the main flows above, these areas also carry real logic that must be ported. (Most reuse the same `transactions` / `transaction_payments` / `variation_location_details` foundations.)
 
**Procurement & order documents**
- **Purchase Orders** (`PurchaseOrderController`) and **Purchase Requisitions** (`PurchaseRequisitionController`) — pre-purchase documents that later convert into a `purchase` transaction.
- **Sales Orders** (`SalesOrderController`) — pre-sale documents converted into a `sell`.
- **Combined Purchase Return** — returns spanning multiple purchases.
**Pricing, tax & discounts**
- **Selling Price Groups** — multiple price tiers per variation (per customer group / location); role permissions can restrict which group a user sees.
- **Discounts module** (`discounts`, `discount_variations`) — time-bound, per-product/category discounts applied automatically at POS.
- **Tax groups** (`group_sub_taxes`) — combined taxes (e.g. CGST+SGST) as one selectable rate.
- **Reward points** — `rp_earned` / `rp_redeemed` on transactions; configurable earning/redemption rules.
**POS-specific**
- **Cash Register** (`CashRegisterUtil`, `cash_registers`, `cash_register_transactions`) — open/close a register per cashier session, with denominations (`cash_denominations`) and cash-in/out.
- **Quotations, Drafts, Suspended sales** — non-final `sell` states that don't move stock or take payment.
- **Subscriptions / recurring invoices** — `subscription_no`, `subscription_repeat_on` auto-generate repeat sales.
- **Invoice layouts & schemes** (`invoice_layouts`, `invoice_schemes`) — per-location invoice numbering and print templates; **printers** (`printers`) for receipt printing.
**Restaurant (in core)**
- Tables (`res_tables`), **Modifiers** (`res_product_modifier_sets`), **Kitchen orders** (`is_kitchen_order`, `res_order_status`), **Waiters/service staff** (`res_waiter_id`, service-staff roles), **Bookings** (`bookings`), **Types of Service** (`types_of_services`, e.g. dine-in/takeaway with extra charges).
**Inventory extras**
- **Warranties** (`warranties`, `sell_line_warranties`) — warranty attached to sold lines.
- **Wastage** (`wastage_types`) — recording spoilage/wastage.
- **Product racks/locations** (`product_racks`, `product_locations`) — physical placement.
**Accounting module**
- Ledger accounts (`accounts`, `account_types`), `account_transactions`, balance sheet / trial balance / cash-flow reports; every payment posts here.
**Data tools & system**
- **Import** tools — products (`ImportProductsController`), opening stock, sales (CSV/Excel).
- **Custom Fields** (`custom_fields`, `custom_field_masters`, `custom_fields_values`) — admin-defined extra fields on products/contacts/etc.
- **Document & Notes** (`document_and_notes`) — polymorphic attachments/notes on records.
- **Notification Templates** (`notification_templates`) — per-action email/SMS templates with placeholders.
- **Activity Log** (`activity_log`, spatie/activitylog) — audit trail of changes.
- **Backup** (`BackUpController`, spatie/backup) — scheduled DB/file backups to local/Dropbox/S3.
**Essentials (HR) — beyond payroll**
- **Attendance** (clock-in/out, IP + geolocation, shifts `essentials_shifts`/`essentials_user_shifts`).
- **Leave** (`essentials_leaves`, `essentials_leave_types`, balances + approval workflow).
- **Holidays** (`essentials_holidays`).
- **Allowances & Deductions** (fixed/percent, assigned to many users).
- **Claims & Reimbursements** (`essentials_claim_reimbursement` + categories).
- **To-Do / Tasks** (`essentials_to_dos`, comments, assignees).
- **Knowledge Base** (`essentials_kb`, `essentials_kb_users`).
- **Internal Messages** (`essentials_messages`), **Reminders** (`essentials_reminders`).
- **Sales Targets** (`essentials_user_sales_targets`) — feed commission in payroll.
- **Documents & shares** (`essentials_documents`, `essentials_document_shares`), **Training** (`trainings`, `training_docs`).
**Manufacturing module**
- Recipes (`mfg_recipes`), recipe ingredients (`mfg_recipe_ingredients`), ingredient groups (`mfg_ingredient_groups`); production consumes ingredient stock; recipe-based deduction also triggers at sale time.
**Document Sign module**
- E-signature documents (`document_signs`, `document_sign_documents`) and signed receipts (`document_sign_receipts`).
**Superadmin & Connector (SaaS plumbing)**
- **Superadmin** — subscription packages, per-tenant quotas, billing (Stripe/PayPal).
- **Connector** — the existing public REST API (token-based) for external/mobile clients.
- **AI Assistance** — OpenAI-backed helper features.
> **Multi-tenant confirmation:** Yes — single shared database, scoped by `business_id`, with a second scoping level by location. Evidence: `business_id` on every table; `SetSessionData` middleware loads the tenant's business/currency/financial-year into session; roles/permissions namespaced `#business_id`; Superadmin manages per-business subscriptions/quotas. In PERN: put `business_id` + permitted locations in the JWT, and enforce tenant scoping centrally via Prisma middleware so no query can leak across tenants.
 
## 3.5 Full Feature Walkthrough — Sidebar by Sidebar (User-Journey Style)
 
This is a **complete tour of the application as the user sees it** — every menu and sub-menu in the left sidebar, in order, explained as a short user journey: *what the user clicks → what the backend does → which tables change → what comes out*. The sidebar is built in `AdminSidebarMenu.php`; each item only appears if the user has the matching permission and the related module is enabled. Nothing from the sidebar is skipped here.
 
> **How to read each item:** `Screen → user action → controller/service → DB tables written/read → result & side-effects`. The deep flows (sale, purchase, payroll) were detailed in 3.3; here they are placed in their menu context so the whole map is visible.
 
### 🏠 Home (Dashboard)
**For:** the landing screen with KPIs. **Journey:** open Home → `HomeController@index` reads `transactions` (today's sales/purchases, due amounts), `variation_location_details` (stock alerts), `contacts` (dues) for the current `business_id` → returns totals + charts. Read-only; nothing is written.
 
### 👥 User Management
- **Users** — list/add/edit staff. `ManageUserController` → writes `users`, assigns role (`model_has_roles`) and location permissions (`model_has_permissions`). (Full flow in 3.3.)
- **Roles** — define permission sets. `RoleController` → writes `roles` (`<name>#<business_id>`) + `role_has_permissions`; auto-creates missing `permissions`.
- **Sales Commission Agents** — staff who earn commission on sales. Marks a `users` row with `is_cmmsn_agnt=1` + `cmmsn_percent`. At sale time the agent is stored on the transaction (`commission_agent`) and later paid via reports/payroll.
### 📇 Contacts
- **Suppliers / Customers** — `ContactController@index` filtered by `type`. Add/edit writes `contacts` (`type`, `opening_balance`, `credit_limit`, `customer_group_id`). Opening balance creates an `opening_balance` transaction.
- **Customer Groups** — `CustomerGroupController` → `customer_groups`; used for group pricing (links to a `selling_price_group`).
- **Import Contacts** — upload CSV → bulk insert into `contacts`.
- **Map** — `contactMap()` plots contacts using the Google Maps API (only shows if `GOOGLE_MAP_API_KEY` is set).
### 📦 Products
- **List Products / Add Product** — `ProductController`; writes `products` + `product_variations` + `variations` (prices, SKU). (Full flow in 3.3.)
- **Print Labels** — `LabelsController` → generate barcode/label stickers using a `barcodes` layout; pure output.
- **Variations** — `VariationTemplateController` → `variation_templates` + `variation_value_templates` (e.g. Size = S/M/L) reused when creating variable products.
- **Import Products / Import Opening Stock** — `ImportProductsController` / `ImportOpeningStockController`: CSV upload → bulk create products and seed `variation_location_details` (opening stock = an `opening_stock` transaction).
- **Selling Price Group** — `SellingPriceGroupController` → `selling_price_groups`; each group gives a price tier stored per variation in `variation_group_prices`.
- **Units** — `UnitController` → `units` (with sub-units + multiplier).
- **Categories** — `TaxonomyController?type=product` → `categories` (`category_type='product'`).
- **Brands** — `BrandController` → `brands`.
- **Warranties** — `WarrantyController` → `warranties`; attached to sold lines via `sell_line_warranties`.
### 🛒 Purchases *(module: purchases)*
- **Purchase Requisition** — `PurchaseRequisitionController`: an internal "we need to buy these" request; later pulled into a purchase. (Shown only if `enable_purchase_requisition`.)
- **Purchase Order (PO)** — `PurchaseOrderController`: an order sent to a supplier; converts into a purchase on receipt. (Shown only if `enable_purchase_order`.)
- **Add / List Purchase** — `PurchaseController`: `transactions(type=purchase)` + `purchase_lines`; status `received` **increases** `variation_location_details.qty_available`. (Full flow in 3.3.)
- **Purchase Return** — `PurchaseReturnController`: a `purchase_return` transaction that **reduces** stock and supplier dues.
### 🧾 Sell *(modules: add_sale / pos_sale)*
- **Sales Order (SO)** — `SalesOrderController`: a confirmed order before invoicing; later converted to a sale (`so_line_id` links sell lines back). (Shown only if `enable_sales_order`.)
- **All Sales** — `SellController@index`: every sale invoice.
- **Add Sale** — `SellController@create`: the full (non-POS) invoice form.
- **POS / List POS** — `SellPosController`: the touchscreen POS. Creates `transactions(type=sell)` + `transaction_sell_lines`, **decreases** stock, takes multi-payment (`transaction_payments`). (Full flow in 3.3.)
- **Add Draft / List Drafts** — saved unfinished sales (`status=draft`); no stock/payment movement.
- **Add Quotation / List Quotations** — price quotes (`status=draft`, `is_quotation=1`); convert to a sale later.
- **Sell Return** — `SellReturnController`: `sell_return` transaction; **re-increases** stock, adjusts customer dues.
- **Shipments** — `SellController@shipments`: track delivery status (`shipping_status`, `delivered_to`, `delivery_person`) on sales.
- **Discounts** — `DiscountController` → `discounts` (+ `discount_variations`): time-bound auto-discounts by brand/category/location, applied automatically at POS.
- **Subscriptions** — recurring invoices (`subscription_no`, `recur_interval`): the system auto-creates repeat sales on schedule.
- **Import Sales** — `ImportSalesController`: bulk-create historical sales from CSV.
### 🔁 Stock Transfers *(module: stock_transfers)*
`StockTransferController`: move stock between two locations. Creates paired `sell_transfer` + `purchase_transfer` transactions; **decreases** source `qty_available` and **increases** destination, with an `in_transit` state in between.
 
### 📉 Stock Adjustment / Wastage *(module: stock_adjustment)*
`WastageController`: correct stock for damage/loss/theft. Creates `transactions(type=stock_adjustment)` + `stock_adjustment_lines`; **reduces** `qty_available` and bumps `purchase_lines.quantity_adjusted`. Reason types come from `wastage_types`.
 
### 💸 Expenses *(module: expenses)*
`ExpenseController`: record business spending. Creates `transactions(type=expense)` against an `expense_categories` entry; paying it writes `transaction_payments` and posts to the `accounts` ledger. **Categories** managed via `ExpenseCategoryController`.
 
### 🏦 Payment Accounts *(module: account)*
`AccountController` / `AccountReportsController` — the bookkeeping ledger:
- **List Accounts** — `accounts` (bank/cash). Every payment (sell/purchase/expense/payroll) posts a row into `account_transactions`.
- **Balance Sheet / Trial Balance / Cash Flow / Payment Account Report** — computed views over `account_transactions`. Read-only.
### 📊 Reports
`ReportController` (the big read-only reporting engine). Every report reads existing tables for the current `business_id`/locations and renders tables + charts (no writes). The full set in the sidebar: **Profit/Loss**, **Report 606 (purchase)** & **607 (sale)**, **Purchase & Sell**, **Tax**, **User report**, **User Sales Target**, **Customer & Supplier**, **Customer Group**, **Stock**, **Stock Expiry**, **Lot**, **Stock Adjustment**, **Trending Products**, **Items**, **Product Purchase**, **Product Sell**, **Purchase Payment**, **Sell Payment**, **Expense**, **Register** (cash-register sessions), **Sales Representative**, **Table report** (restaurant), **GST Sales/Purchase** (India), **Service Staff**, **Claim & Reimbursement**, and **Activity Log** (audit, admin only).
 
### 💾 Backup
`BackUpController` (spatie/backup): on-demand or scheduled DB + file backup, stored locally or pushed to Dropbox/S3.
 
### 🧩 Modules
`Install\ModulesController`: install/enable/disable add-on modules (Essentials, Manufacturing, etc.). Module state is read by `ModuleUtil`.
 
### 🍽️ Restaurant menus *(modules: booking / kitchen / service_staff)*
- **Bookings** — `Restaurant\BookingController` → `bookings` (table reservations with start/end, waiter, status).
- **Kitchen** — `Restaurant\KitchenController`: live screen of orders to cook; reads sale lines flagged `is_kitchen_order` with `res_order_status` (received → cooked).
- **Orders (Service Staff)** — `Restaurant\OrderController`: waiter view of open table orders.
### ✉️ Notification Templates
`NotificationTemplateController` → `notification_templates`: per-event email/SMS/WhatsApp templates with placeholders, auto-sent on actions like new sale, payment, due reminder.
 
### ⚙️ Settings
- **Business Settings** — `BusinessController@getBusinessSettings`: edits the big `business` settings row (tax, modules, POS, prefixes, financial year, reward points, etc.).
- **Business Locations** — `BusinessLocationController` → `business_locations`.
- **Invoice Settings** — `InvoiceSchemeController`: `invoice_schemes` (numbering) + `invoice_layouts` (print templates).
- **Barcode Settings** — `BarcodeController` → `barcodes` (label sheet layouts).
- **Receipt Printers** — `PrinterController` → `printers`.
- **Tax Rates** — `TaxRateController` → `tax_rates` (+ tax groups via `group_sub_taxes`).
- **Wastage Types** — `WastageTypeController` → `wastage_types`.
- **Tables / Modifiers / Types of Service** *(restaurant)* — `res_tables`, `res_product_modifier_sets`, `types_of_services`.
### 🧑‍💼 HRM / Essentials *(module-injected menu)*
Added by the Essentials module via `modifyAdminMenu`. Covers the whole HR cycle:
- **Attendance** — `AttendanceController` → `essentials_attendances` (clock-in/out, IP + geolocation, shift).
- **Leaves / Leave Types** — `EssentialsLeaveController` → `essentials_leaves` (+ types, balances, approval).
- **Holidays** — `EssentialsHolidayController` → `essentials_holidays`.
- **Shifts** — `ShiftController` → `essentials_shifts` / `essentials_user_shifts`.
- **Departments / Designations** — stored as `categories` (`hrm_department` / `hrm_designation`).
- **Payroll** — `PayrollController`: salary run → `transactions(type=payroll)` grouped in `essentials_payroll_groups`; paid via `transaction_payments`. (Full flow in 3.3.)
- **Allowances & Deductions** — `EssentialsAllowanceAndDeductionController` → `essentials_allowances_and_deductions`.
- **Claims & Reimbursements** — `ClaimReimbursementController` → `essentials_claim_reimbursement`.
- **To-Do** — `ToDoController` → `essentials_to_dos` (+ comments, assignees).
- **Knowledge Base** — `KnowledgeBaseController` → `essentials_kb`.
- **Reminders / Messages** — `essentials_reminders` / `essentials_messages`.
- **Sales Targets** — `SalesTargetController` → `essentials_user_sales_targets` (feeds payroll commission).
- **Documents** — `DocumentController` → `essentials_documents` (+ shares).
- **Training** — `TrainingController` → `trainings` / `training_docs`.
### 🏭 Manufacturing *(module-injected menu)*
- **Recipes** — define a product's recipe → `mfg_recipes` + `mfg_recipe_ingredients` (+ `mfg_ingredient_groups`).
- **Production** — produce a finished product: **consumes** ingredient stock and **adds** finished-good stock (a manufacturing transaction). At sale time, a recipe product also deducts ingredients instead of finished stock.
### ✍️ Document Sign *(module-injected menu)*
`document_signs` + `document_sign_documents` + `document_sign_receipts`: upload a document, send for e-signature, store the signed copy and receipt.
 
> **Coverage note:** the above is the entire sidebar, including the items that only appear when a module or setting is enabled. Combined with the column-by-column `ERP_Database_Dictionary.md`, this is the full functional map needed to rebuild the system on PERN.
 
---
 
# 4. Third-Party Dependencies & External Data Sources
 
Verified from `composer.json`, `.env` / `.env.example`, and `config/*`. These are the points where the system **sends or receives data from outside** — each must be re-integrated (or replaced) in PERN.
 
## 4.1 Payment Gateways (money in/out + callbacks)
 
| Integration | Library / config | Used for | Data flow |
|---|---|---|---|
| **Stripe** | `stripe/stripe-php`, `STRIPE_*` | Card payments, SaaS subscription billing | Outbound charge + inbound webhook/confirmation |
| **Razorpay** | `razorpay/razorpay`, `RAZORPAY_*` | Card/UPI payments (India) | Outbound order + inbound payment status |
| **PayPal** | `srmklive/paypal`, `PAYPAL_*` (live + sandbox) | Online payments / subscription | Redirect + IPN callback |
| **Paystack** | `unicodeveloper/laravel-paystack`, `PAYSTACK_*` | Payments (Africa) | Redirect + verify callback |
| **Pesapal** | `knox/pesapal`, `PESAPAL_*` | Payments (East Africa) | Redirect + IPN callback |
 
## 4.2 Messaging & Notifications
 
| Integration | Library / config | Used for | Data flow |
|---|---|---|---|
| **Email / SMTP** | Laravel Mail, `MAIL_*` (+ Mailgun/Postmark/SES in `services.php`) | Invoices, payslips, notifications, password reset | Outbound email |
| **Twilio (SMS)** | `aloha/twilio` | SMS notifications/OTP | Outbound SMS |
| **Pusher** | `pusher/pusher-php-server`, `PUSHER_*`, `BROADCAST_DRIVER` | Real-time broadcast / notifications | Outbound realtime events |
 
## 4.3 E-commerce & External Catalog
 
| Integration | Library / config | Used for | Data flow |
|---|---|---|---|
| **WooCommerce** | `automattic/woocommerce` (Woocommerce module) | Sync products, stock & orders with a WooCommerce store | **Two-way** product/stock/order data |
| **Connector API** | Laravel Passport + Connector module | Public REST API for mobile/external apps | Inbound/outbound JSON |
 
## 4.4 Storage, AI & Maps
 
| Integration | Library / config | Used for | Data flow |
|---|---|---|---|
| **AWS S3** | `league/flysystem-aws-s3-v3`, `AWS_*` | Product images, invoices, documents | File upload/download |
| **AWS SES** | `services.php` ses | Transactional email (option) | Outbound email |
| **Dropbox** | `spatie/flysystem-dropbox`, `DROPBOX_ACCESS_TOKEN` | Backup destination | Outbound backup files |
| **OpenAI** | `openai-php/laravel`, `OPENAI_API_KEY` (AI Assistance module) | AI helper features | Outbound prompt / inbound completion |
| **Google Maps** | `GOOGLE_MAP_API_KEY` | Location/maps (addresses, attendance geolocation) | Outbound map/geocode requests |
 
## 4.5 Document / Reporting Libraries (no external data, but must be replaced)
 
| Library | Purpose | PERN replacement |
|---|---|---|
| `barryvdh/laravel-dompdf`, `mpdf/mpdf` | Invoice/payslip/report PDFs | Puppeteer / pdfkit |
| `maatwebsite/excel` | Excel import/export | exceljs |
| `milon/barcode` | Barcode/label generation | bwip-js / jsbarcode |
| `phpoffice/phpword` | Word document export | docx (npm) |
| `knuckleswtf/scribe` | API documentation | Swagger/OpenAPI (built into NestJS) |
| `spatie/laravel-backup` | DB/file backups | node-cron + cloud SDK |
| `consoletvs/charts` | Server-side charts | Recharts/Chart.js (frontend) |
 
> **Action for conversion:** each integration above becomes a dedicated service/module in the new backend (e.g. `PaymentsModule` with Stripe/Razorpay/PayPal adapters, `NotificationsModule` with email/SMS/Pusher, `WooCommerceModule`, `StorageModule`). Keep gateway credentials in env/secrets, expose webhooks as Express/NestJS routes, and process callbacks via BullMQ jobs.
 
---
 
*This document is based entirely on a direct reading of the project's source, database, and configuration. Use Sections 1–2 for the technology decision, Section 3 to understand the existing business logic, and Section 4 for integrations. The companion `ERP_Database_Dictionary.md` gives the column-by-column blueprint for the new schema.*