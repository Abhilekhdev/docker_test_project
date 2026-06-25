# ERP Database Dictionary — All 110 Tables

### UltimatePOS-based ERP (MySQL) — every table and its key columns explained

> Companion to the main conversion document. For each table you get: **what it is for**, and **what each column means / why it exists**. Use this as the blueprint for the new PostgreSQL (Prisma) schema. Standard columns repeat across tables: `id` = primary key, `business_id` = tenant scope, `created_by` = user who made it, `created_at/updated_at` = timestamps, `deleted_at` = soft-delete (NULL means active).

## Table of Contents

1. Tenancy & Configuration
2. Users, Roles & Access
3. Auth & Session (replaced by JWT in PERN)
4. Products & Catalogue
5. Contacts
6. Sales, Purchases & Payments
7. Inventory & Stock
8. Tax, Pricing & Discounts
9. Accounting, Cash & Expenses
10. Warranties, Services & Wastage
11. HR / Essentials
12. Training
13. Manufacturing
14. Document Sign
15. Restaurant
16. Custom Fields & Notes
17. System & Misc


---

# 1. Tenancy & Configuration


## `business`  (81 columns)

The tenant (company) master row + almost all business-level settings (JSON columns).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `currency_id` | int(10) | Foreign key → currency. |
| `start_date` | date | Date. |
| `tax_number_1` | varchar(100) | — |
| `tax_label_1` | varchar(10) | — |
| `tax_number_2` | varchar(100) | — |
| `tax_label_2` | varchar(10) | — |
| `code_label_1` | varchar(191) | — |
| `code_1` | varchar(191) | — |
| `code_label_2` | varchar(191) | — |
| `code_2` | varchar(191) | — |
| `default_sales_tax` | int(10) | — |
| `default_profit_percent` | double(5,2) | Percentage value. |
| `owner_id` | int(10) | Foreign key → owner. |
| `time_zone` | varchar(191) | — |
| `fy_start_month` | tinyint(4) | — |
| `accounting_method` | enum('fifo','lifo','avco') | — |
| `default_sales_discount` | decimal(5,2) | — |
| `sell_price_tax` | enum('includes','excludes') | — |
| `logo` | varchar(191) | — |
| `login_logo` | varchar(255) | — |
| `sku_prefix` | varchar(191) | Display/label text. |
| `enable_product_expiry` | tinyint(1) | Setting/toggle (on/off). |
| `expiry_type` | enum('add_expiry','add_manufacturing') | Type/kind selector. |
| `on_product_expiry` | enum('keep_selling','stop_selling','auto_delete') | — |
| `stop_selling_before` | int(11) | Setting/toggle (on/off). |
| `enable_tooltip` | tinyint(1) | Setting/toggle (on/off). |
| `purchase_in_diff_currency` | tinyint(1) | — |
| `purchase_currency_id` | int(10) | Foreign key → purchase_currency. |
| `p_exchange_rate` | decimal(20,3) | — |
| `transaction_edit_days` | int(10) | — |
| `stock_expiry_alert_days` | int(10) | — |
| `keyboard_shortcuts` | text | — |
| `pos_settings` | text | JSON settings/data. |
| `manufacturing_settings` | text | JSON settings/data. |
| `essentials_settings` | longtext | JSON settings/data. |
| `weighing_scale_setting` | text | — |
| `enable_brand` | tinyint(1) | Setting/toggle (on/off). |
| `enable_category` | tinyint(1) | Setting/toggle (on/off). |
| `enable_sub_category` | tinyint(1) | Setting/toggle (on/off). |
| `enable_price_tax` | tinyint(1) | Setting/toggle (on/off). |
| `enable_purchase_status` | tinyint(1) | Setting/toggle (on/off). |
| `enable_lot_number` | tinyint(1) | Setting/toggle (on/off). |
| `default_unit` | int(11) | — |
| `enable_sub_units` | tinyint(1) | Setting/toggle (on/off). |
| `enable_racks` | tinyint(1) | Setting/toggle (on/off). |
| `enable_row` | tinyint(1) | Setting/toggle (on/off). |
| `enable_position` | tinyint(1) | Setting/toggle (on/off). |
| `enable_editing_product_from_purchase` | tinyint(1) | Setting/toggle (on/off). |
| `sales_cmsn_agnt` | enum('logged_in_user','user','cmsn_agnt') | — |
| `item_addition_method` | tinyint(1) | — |
| `enable_inline_tax` | tinyint(1) | Setting/toggle (on/off). |
| `currency_symbol_placement` | enum('before','after') | — |
| `enabled_modules` | text | — |
| `date_format` | varchar(191) | Date. |
| `time_format` | enum('12','24') | — |
| `currency_precision` | tinyint(4) | — |
| `quantity_precision` | tinyint(4) | — |
| `ref_no_prefixes` | text | — |
| `theme_color` | char(20) | — |
| `created_by` | int(11) | User id who created this record. |
| `enable_rp` | tinyint(1) | Setting/toggle (on/off). |
| `rp_name` | varchar(191) | — |
| `amount_for_unit_rp` | decimal(22,4) | — |
| `min_order_total_for_rp` | decimal(22,4) | — |
| `max_rp_per_order` | int(11) | — |
| `redeem_amount_per_unit_rp` | decimal(22,4) | — |
| `min_order_total_for_redeem` | decimal(22,4) | — |
| `min_redeem_point` | int(11) | — |
| `max_redeem_point` | int(11) | — |
| `rp_expiry_period` | int(11) | — |
| `rp_expiry_type` | enum('month','year') | Type/kind selector. |
| `email_settings` | text | JSON settings/data. |
| `sms_settings` | text | JSON settings/data. |
| `custom_labels` | text | — |
| `common_settings` | text | JSON settings/data. |
| `is_active` | tinyint(1) | Boolean flag (1/0). |
| `account_no` | varchar(100) | Numeric value/count. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `business_locations`  (27 columns)

Physical locations/branches belonging to a business.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | varchar(191) | Which business location this row belongs to. |
| `name` | varchar(256) | Display name. |
| `landmark` | text | — |
| `country` | varchar(100) | — |
| `state` | varchar(100) | — |
| `city` | varchar(100) | — |
| `zip_code` | char(7) | — |
| `invoice_scheme_id` | int(10) | Foreign key → invoice_scheme. |
| `sale_invoice_scheme_id` | int(11) | Foreign key → sale_invoice_scheme. |
| `invoice_layout_id` | int(10) | Foreign key → invoice_layout. |
| `sale_invoice_layout_id` | int(11) | Foreign key → sale_invoice_layout. |
| `selling_price_group_id` | int(11) | Foreign key → selling_price_group. |
| `print_receipt_on_invoice` | tinyint(1) | — |
| `receipt_printer_type` | enum('browser','printer') | Type/kind selector. |
| `printer_id` | int(11) | Foreign key → printer. |
| `mobile` | varchar(191) | Mobile number. |
| `alternate_number` | varchar(191) | Numeric value/count. |
| `email` | varchar(191) | Email address. |
| `website` | varchar(191) | — |
| `featured_products` | text | — |
| `is_active` | tinyint(1) | Boolean flag (1/0). |
| `default_payment_accounts` | text | — |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `currencies`  (9 columns)

Currency master (code, symbol, separators).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `country` | varchar(100) | — |
| `currency` | varchar(100) | — |
| `code` | varchar(25) | Short code. |
| `symbol` | varchar(25) | — |
| `thousand_separator` | varchar(10) | — |
| `decimal_separator` | varchar(10) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `system`  (3 columns)

Global key/value system settings (incl. installed module versions).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `key` | varchar(191) | — |
| `value` | text | — |


## `reference_counts`  (6 columns)

Counters used to generate reference numbers per document type.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `ref_type` | varchar(191) | Type/kind selector. |
| `ref_count` | int(11) | Numeric value/count. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `dashboard_configurations`  (8 columns)

Saved dashboard widget configuration per user.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `created_by` | int(11) | User id who created this record. |
| `name` | varchar(191) | Display name. |
| `color` | varchar(191) | — |
| `configuration` | text | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `printers`  (12 columns)

Receipt printer configurations.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `connection_type` | enum('network','windows','linux') | Type/kind selector. |
| `capability_profile` | enum('default','simple','SP2000','TEP-200M','P822D') | — |
| `char_per_line` | varchar(191) | — |
| `ip_address` | varchar(191) | Address text. |
| `port` | varchar(191) | — |
| `path` | varchar(191) | — |
| `created_by` | int(10) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `barcodes`  (18 columns)

Barcode/label sticker-sheet layout definitions used when printing labels.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `description` | text | Free-text description. |
| `width` | double(22,4) | — |
| `height` | double(22,4) | — |
| `paper_width` | double(22,4) | — |
| `paper_height` | double(22,4) | — |
| `top_margin` | double(22,4) | — |
| `left_margin` | double(22,4) | — |
| `row_distance` | double(22,4) | — |
| `col_distance` | double(22,4) | — |
| `stickers_in_one_row` | int(11) | — |
| `is_default` | tinyint(1) | Boolean flag (1/0). |
| `is_continuous` | tinyint(1) | Boolean flag (1/0). |
| `stickers_in_one_sheet` | int(11) | — |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `invoice_schemes`  (12 columns)

Invoice numbering schemes (prefix, counter, padding).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `scheme_type` | enum('blank','year') | Type/kind selector. |
| `number_type` | varchar(100) | Type/kind selector. |
| `prefix` | varchar(191) | Invoice number prefix. |
| `start_number` | int(11) | Starting counter value. |
| `invoice_count` | int(11) | Current counter value (increments per invoice). |
| `total_digits` | int(11) | Zero-padding width of the counter. |
| `is_default` | tinyint(1) | Boolean flag (1/0). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `invoice_layouts`  (85 columns)

Invoice/receipt print templates — labels and show/hide toggles.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `header_text` | text | Display/label text. |
| `invoice_no_prefix` | varchar(191) | Display/label text. |
| `quotation_no_prefix` | varchar(191) | Display/label text. |
| `invoice_heading` | varchar(191) | Display/label text. |
| `sub_heading_line1` | varchar(191) | — |
| `sub_heading_line2` | varchar(191) | — |
| `sub_heading_line3` | varchar(191) | — |
| `sub_heading_line4` | varchar(191) | — |
| `sub_heading_line5` | varchar(191) | — |
| `invoice_heading_not_paid` | varchar(191) | — |
| `invoice_heading_paid` | varchar(191) | — |
| `quotation_heading` | varchar(191) | Display/label text. |
| `sub_total_label` | varchar(191) | Display/label text. |
| `discount_label` | varchar(191) | Display/label text. |
| `tax_label` | varchar(191) | Display/label text. |
| `total_label` | varchar(191) | Display/label text. |
| `round_off_label` | varchar(191) | Display/label text. |
| `total_due_label` | varchar(191) | Display/label text. |
| `paid_label` | varchar(191) | Display/label text. |
| `show_client_id` | tinyint(1) | Foreign key → show_client. |
| `client_id_label` | varchar(191) | Display/label text. |
| `client_tax_label` | varchar(191) | Display/label text. |
| `date_label` | varchar(191) | Date. |
| `date_time_format` | varchar(191) | Date. |
| `show_time` | tinyint(1) | Setting/toggle (on/off). |
| `show_brand` | tinyint(1) | Setting/toggle (on/off). |
| `show_sku` | tinyint(1) | Setting/toggle (on/off). |
| `show_cat_code` | tinyint(1) | Setting/toggle (on/off). |
| `show_expiry` | tinyint(1) | Setting/toggle (on/off). |
| `show_lot` | tinyint(1) | Setting/toggle (on/off). |
| `show_image` | tinyint(1) | Setting/toggle (on/off). |
| `show_sale_description` | tinyint(1) | Setting/toggle (on/off). |
| `sales_person_label` | varchar(191) | Display/label text. |
| `show_sales_person` | tinyint(1) | Setting/toggle (on/off). |
| `table_product_label` | varchar(191) | Display/label text. |
| `table_qty_label` | varchar(191) | Display/label text. |
| `table_unit_price_label` | varchar(191) | Display/label text. |
| `table_subtotal_label` | varchar(191) | Display/label text. |
| `cat_code_label` | varchar(191) | Display/label text. |
| `logo` | varchar(191) | — |
| `show_logo` | tinyint(1) | Setting/toggle (on/off). |
| `show_business_name` | tinyint(1) | Setting/toggle (on/off). |
| `show_location_name` | tinyint(1) | Setting/toggle (on/off). |
| `show_landmark` | tinyint(1) | Setting/toggle (on/off). |
| `show_city` | tinyint(1) | Setting/toggle (on/off). |
| `show_state` | tinyint(1) | Setting/toggle (on/off). |
| `show_zip_code` | tinyint(1) | Setting/toggle (on/off). |
| `show_country` | tinyint(1) | Setting/toggle (on/off). |
| `show_mobile_number` | tinyint(1) | Setting/toggle (on/off). |
| `show_alternate_number` | tinyint(1) | Setting/toggle (on/off). |
| `show_email` | tinyint(1) | Setting/toggle (on/off). |
| `show_tax_1` | tinyint(1) | Setting/toggle (on/off). |
| `show_tax_2` | tinyint(1) | Setting/toggle (on/off). |
| `show_barcode` | tinyint(1) | Setting/toggle (on/off). |
| `show_payments` | tinyint(1) | Setting/toggle (on/off). |
| `show_customer` | tinyint(1) | Setting/toggle (on/off). |
| `customer_label` | varchar(191) | Display/label text. |
| `commission_agent_label` | varchar(191) | Display/label text. |
| `show_commission_agent` | tinyint(1) | Setting/toggle (on/off). |
| `show_reward_point` | tinyint(1) | Setting/toggle (on/off). |
| `highlight_color` | varchar(10) | — |
| `footer_text` | text | Display/label text. |
| `module_info` | text | — |
| `common_settings` | text | JSON settings/data. |
| `is_default` | tinyint(1) | Boolean flag (1/0). |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `show_letter_head` | tinyint(1) | Setting/toggle (on/off). |
| `letter_head` | varchar(191) | — |
| `show_qr_code` | tinyint(1) | Setting/toggle (on/off). |
| `qr_code_fields` | text | — |
| `design` | varchar(190) | — |
| `cn_heading` | varchar(191) | Display/label text. |
| `cn_no_label` | varchar(191) | Display/label text. |
| `cn_amount_label` | varchar(191) | Display/label text. |
| `table_tax_headings` | text | — |
| `show_previous_bal` | tinyint(1) | Setting/toggle (on/off). |
| `prev_bal_label` | varchar(191) | Display/label text. |
| `change_return_label` | varchar(191) | Display/label text. |
| `product_custom_fields` | text | — |
| `contact_custom_fields` | text | — |
| `location_custom_fields` | text | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 2. Users, Roles & Access


## `users`  (58 columns)

Users and employees — authentication fields plus HR (Essentials) fields.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `user_type` | varchar(191) | "user" for staff/employees (vs system). |
| `surname` | char(10) | — |
| `first_name` | varchar(191) | — |
| `last_name` | varchar(191) | — |
| `username` | varchar(191) | — |
| `email` | varchar(191) | Email address. |
| `password` | varchar(191) | — |
| `language` | char(7) | — |
| `contact_no` | char(15) | Numeric value/count. |
| `address` | text | — |
| `remember_token` | varchar(100) | — |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `essentials_department_id` | int(11) | Department — points to categories(category_type=hrm_department). |
| `essentials_designation_id` | int(11) | Designation — points to categories(category_type=hrm_designation). |
| `essentials_salary` | decimal(22,4) | Base salary (HR). |
| `essentials_pay_period` | varchar(191) | Pay period: month / week / day. |
| `essentials_pay_cycle` | varchar(191) | — |
| `available_at` | datetime | Timestamp. |
| `paused_at` | datetime | Timestamp. |
| `max_sales_discount_percent` | decimal(5,2) | Max discount this user can give. |
| `allow_login` | tinyint(1) | 1 = can log in. |
| `status` | enum('active','inactive','terminated') | Status of the record. |
| `crm_contact_id` | int(10) | Foreign key → crm_contact. |
| `is_cmmsn_agnt` | tinyint(1) | 1 = this user is a sales commission agent. |
| `cmmsn_percent` | decimal(4,2) | Sales commission percentage. |
| `selected_contacts` | tinyint(1) | 1 = restricted to specific contacts (user_contact_access). |
| `dob` | date | — |
| `gender` | varchar(191) | — |
| `marital_status` | enum('married','unmarried','divorced') | — |
| `blood_group` | char(10) | — |
| `contact_number` | char(20) | Numeric value/count. |
| `alt_number` | varchar(191) | Numeric value/count. |
| `family_number` | varchar(191) | Numeric value/count. |
| `fb_link` | varchar(191) | — |
| `twitter_link` | varchar(191) | — |
| `social_media_1` | varchar(191) | — |
| `social_media_2` | varchar(191) | — |
| `permanent_address` | text | Address text. |
| `current_address` | text | Address text. |
| `guardian_name` | varchar(191) | — |
| `bank_details` | longtext | JSON bank details for payroll. |
| `id_proof_name` | varchar(191) | — |
| `id_proof_number` | varchar(191) | Numeric value/count. |
| `location_id` | int(11) | Primary work location. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |
| `password_change_at` | varchar(225) | Timestamp. |
| `parent_id` | varchar(225) | The employee’s manager/approver. |
| `activity_codes` | text | JSON list of attendance activities allowed for the user. |
| `aadhar_no` | varchar(255) | Numeric value/count. |
| `pan_no` | varchar(15) | Numeric value/count. |
| `joining_date` | varchar(255) | Date. |
| `exit_date` | varchar(255) | Date. |
| `exit_reason` | longtext | — |
| `is_team_lead` | int(2) | Boolean flag (1/0). |
| `team_leader` | int(11) | — |


## `roles`  (8 columns)

Roles, namespaced per business (e.g. Admin#15).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Role name namespaced as <Role>#<business_id>. |
| `guard_name` | varchar(191) | Auth guard (Spatie) — usually "web". |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `is_default` | tinyint(1) | 1 = system default role (Admin/Cashier). |
| `is_service_staff` | tinyint(1) | 1 = a restaurant service-staff role. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `permissions`  (5 columns)

Spatie permission master — one row per feature action (e.g. sell.create).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Feature-action key (e.g. product.view, sell.create). |
| `guard_name` | varchar(191) | Auth guard (Spatie) — usually "web". |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `model_has_roles`  (3 columns)

Spatie pivot — roles assigned to a user/model.

| Column | Type | Meaning |
|---|---|---|
| `role_id` | int(10) | Foreign key → role. |
| `model_type` | varchar(191) | Type/kind selector. |
| `model_id` | bigint(20) | Foreign key → model. |


## `model_has_permissions`  (3 columns)

Spatie pivot — direct permissions granted to a user/model.

| Column | Type | Meaning |
|---|---|---|
| `permission_id` | int(10) | Foreign key → permission. |
| `model_type` | varchar(191) | Type/kind selector. |
| `model_id` | bigint(20) | Foreign key → model. |


## `role_has_permissions`  (2 columns)

Spatie pivot — permissions inside a role.

| Column | Type | Meaning |
|---|---|---|
| `permission_id` | int(10) | Foreign key → permission. |
| `role_id` | int(10) | Foreign key → role. |


## `user_contact_access`  (3 columns)

Pivot — which contacts a restricted user is allowed to access.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `contact_id` | int(11) | Related contact (customer/supplier). |


## `user_documents`  (11 columns)

Documents uploaded for a user.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `doc_name` | varchar(255) | — |
| `document` | varchar(255) | — |
| `doc_note` | varchar(255) | Free-text note. |
| `status` | tinyint(1) | Status of the record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |


## `surnames`  (4 columns)

Surname lookup list (used for name autocomplete).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `name` | varchar(255) | Display name. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 3. Auth & Session (replaced by JWT in PERN)


## `oauth_access_tokens`  (9 columns)

Passport OAuth2 access tokens (current API auth).

| Column | Type | Meaning |
|---|---|---|
| `id` | varchar(100) | Primary key. |
| `user_id` | bigint(20) | Related user (employee/customer-user). |
| `client_id` | int(10) | Foreign key → client. |
| `name` | varchar(191) | Display name. |
| `scopes` | text | — |
| `revoked` | tinyint(1) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |
| `expires_at` | datetime | Timestamp. |


## `oauth_auth_codes`  (6 columns)

Passport OAuth2 authorization codes.

| Column | Type | Meaning |
|---|---|---|
| `id` | varchar(100) | Primary key. |
| `user_id` | bigint(20) | Related user (employee/customer-user). |
| `client_id` | int(10) | Foreign key → client. |
| `scopes` | text | — |
| `revoked` | tinyint(1) | — |
| `expires_at` | datetime | Timestamp. |


## `oauth_clients`  (11 columns)

Passport OAuth2 client apps.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `user_id` | bigint(20) | Related user (employee/customer-user). |
| `name` | varchar(191) | Display name. |
| `secret` | varchar(100) | — |
| `provider` | varchar(191) | — |
| `redirect` | text | — |
| `personal_access_client` | tinyint(1) | — |
| `password_client` | tinyint(1) | — |
| `revoked` | tinyint(1) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `oauth_personal_access_clients`  (4 columns)

Passport personal-access client link.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `client_id` | int(10) | Foreign key → client. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `oauth_refresh_tokens`  (4 columns)

Passport OAuth2 refresh tokens.

| Column | Type | Meaning |
|---|---|---|
| `id` | varchar(100) | Primary key. |
| `access_token_id` | varchar(100) | Foreign key → access_token. |
| `revoked` | tinyint(1) | — |
| `expires_at` | datetime | Timestamp. |


## `password_resets`  (3 columns)

Password-reset tokens.

| Column | Type | Meaning |
|---|---|---|
| `email` | varchar(191) | Email address. |
| `token` | varchar(191) | — |
| `created_at` | timestamp | Created timestamp. |


## `sessions`  (6 columns)

Web session store.

| Column | Type | Meaning |
|---|---|---|
| `id` | varchar(191) | Primary key. |
| `user_id` | int(10) | Related user (employee/customer-user). |
| `ip_address` | varchar(45) | Address text. |
| `user_agent` | text | — |
| `payload` | text | — |
| `last_activity` | int(11) | — |


## `migrations`  (3 columns)

Laravel migration history (framework table).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `migration` | varchar(191) | — |
| `batch` | int(11) | — |


---

# 4. Products & Catalogue


## `products`  (29 columns)

Product master record.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `type` | enum('single','variable','modifier','combo') | single / variable / combo. |
| `unit_id` | int(10) | Foreign key → unit. |
| `secondary_unit_id` | int(11) | Foreign key → secondary_unit. |
| `sub_unit_ids` | text | — |
| `brand_id` | int(10) | Foreign key → brand. |
| `category_id` | int(10) | Foreign key → category. |
| `sub_category_id` | int(10) | Foreign key → sub_category. |
| `tax` | int(10) | Default tax rate id (tax_rates). |
| `tax_type` | enum('inclusive','exclusive') | inclusive / exclusive. |
| `enable_stock` | tinyint(1) | 1 = track stock for this product. |
| `alert_quantity` | decimal(22,4) | Low-stock alert threshold. |
| `sku` | varchar(191) | Stock-keeping unit code. |
| `barcode_type` | enum('C39','C128','EAN13','EAN8','UPCA','UPCE') | Barcode symbology (e.g. C128). |
| `expiry_period` | decimal(4,2) | — |
| `expiry_period_type` | enum('days','months') | Type/kind selector. |
| `enable_sr_no` | tinyint(1) | Setting/toggle (on/off). |
| `weight` | varchar(191) | — |
| `image` | varchar(191) | — |
| `product_description` | text | — |
| `created_by` | int(10) | User id who created this record. |
| `preparation_time_in_minutes` | int(11) | — |
| `warranty_id` | int(11) | Default warranty for the product. |
| `is_inactive` | tinyint(1) | 1 = inactive/hidden. |
| `not_for_selling` | tinyint(1) | 1 = used only as ingredient/raw, not sold directly. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `product_variations`  (7 columns)

Variation group/template per product (a DUMMY group exists for single products).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `variation_template_id` | int(11) | Foreign key → variation_template. |
| `name` | varchar(191) | Display name. |
| `product_id` | int(10) | Related product. |
| `is_dummy` | tinyint(1) | Boolean flag (1/0). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `variations`  (15 columns)

Actual sellable units of a product — hold SKU and purchase/sell prices.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `product_id` | int(10) | Related product. |
| `sub_sku` | varchar(191) | SKU of this specific variation. |
| `product_variation_id` | int(10) | Foreign key → product_variation. |
| `variation_value_id` | int(11) | Foreign key → variation_value. |
| `default_purchase_price` | decimal(22,4) | Purchase price (excl. tax). |
| `dpp_inc_tax` | decimal(22,4) | Purchase price incl. tax. |
| `profit_percent` | decimal(22,4) | Margin used to derive sell from purchase price. |
| `default_sell_price` | decimal(22,4) | Selling price (excl. tax). |
| `sell_price_inc_tax` | decimal(22,4) | Selling price incl. tax. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `combo_variations` | text | JSON of component variations (for combo products). |


## `variation_templates`  (5 columns)

Variation attribute templates (e.g. Size, Colour).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `variation_value_templates`  (5 columns)

Values belonging to a variation template (e.g. S, M, L).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `variation_template_id` | int(10) | Foreign key → variation_template. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `variation_group_prices`  (7 columns)

Price-group-specific price for a variation.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `variation_id` | int(10) | Related product variation (the sellable unit). |
| `price_group_id` | int(10) | Foreign key → price_group. |
| `price_inc_tax` | decimal(22,4) | — |
| `price_type` | varchar(191) | Type/kind selector. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `categories`  (12 columns)

Shared taxonomy table — product categories, HR departments & designations, expense/claim categories, distinguished by category_type.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `short_code` | varchar(191) | — |
| `parent_id` | int(11) | Parent row id (self-reference for hierarchy). |
| `created_by` | int(10) | User id who created this record. |
| `category_type` | varchar(191) | What kind of category: product, hrm_department, hrm_designation, etc. |
| `description` | text | Free-text description. |
| `slug` | varchar(191) | URL-friendly key. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `categorizables`  (3 columns)

Polymorphic pivot linking a category to any model.

| Column | Type | Meaning |
|---|---|---|
| `category_id` | int(11) | Foreign key → category. |
| `categorizable_type` | varchar(191) | Type/kind selector. |
| `categorizable_id` | bigint(20) | Foreign key → categorizable. |


## `brands`  (8 columns)

Product brands master.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `description` | text | Free-text description. |
| `created_by` | int(10) | User id who created this record. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `units`  (11 columns)

Units of measure, including sub-units and multipliers.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `actual_name` | varchar(191) | — |
| `short_name` | varchar(191) | — |
| `allow_decimal` | tinyint(1) | Setting/toggle (on/off). |
| `base_unit_id` | int(11) | Parent unit (for sub-units). |
| `base_unit_multiplier` | decimal(20,4) | How many base units = 1 of this unit. |
| `created_by` | int(10) | User id who created this record. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `selling_price_groups`  (8 columns)

Price-tier groups (e.g. Retail / Wholesale).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `description` | text | Free-text description. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `is_active` | tinyint(1) | Boolean flag (1/0). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `customer_groups`  (9 columns)

Customer groups used for group pricing / group discounts.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `amount` | double(5,2) | Money/quantity amount. |
| `price_calculation_type` | varchar(191) | Type/kind selector. |
| `selling_price_group_id` | int(11) | Foreign key → selling_price_group. |
| `created_by` | int(10) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 5. Contacts


## `contacts`  (41 columns)

Customers and suppliers (and leads).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `type` | varchar(191) | customer / supplier / both. |
| `contact_type_radio` | varchar(100) | — |
| `supplier_business_name` | varchar(191) | Company name for a supplier. |
| `name` | varchar(191) | Display name. |
| `prefix` | varchar(191) | — |
| `first_name` | varchar(191) | — |
| `middle_name` | varchar(191) | — |
| `last_name` | varchar(191) | — |
| `email` | varchar(191) | Email address. |
| `contact_id` | varchar(191) | Related contact (customer/supplier). |
| `contact_status` | varchar(191) | — |
| `tax_number` | varchar(191) | Numeric value/count. |
| `city` | varchar(191) | — |
| `state` | varchar(191) | — |
| `country` | varchar(191) | — |
| `address_line_1` | text | — |
| `address_line_2` | text | — |
| `zip_code` | varchar(191) | — |
| `dob` | date | — |
| `mobile` | varchar(191) | Mobile number. |
| `landline` | varchar(191) | — |
| `alternate_number` | varchar(191) | Numeric value/count. |
| `pay_term_number` | int(11) | Credit period length. |
| `pay_term_type` | enum('days','months') | Credit period unit (days/months). |
| `credit_limit` | decimal(22,4) | Max credit allowed (NULL = unlimited). |
| `created_by` | int(10) | User id who created this record. |
| `balance` | decimal(22,4) | Running advance/credit balance. |
| `total_rp` | int(11) | Total reward points. |
| `total_rp_used` | int(11) | — |
| `total_rp_expired` | int(11) | — |
| `is_default` | tinyint(1) | Boolean flag (1/0). |
| `shipping_address` | text | Address text. |
| `shipping_custom_field_details` | longtext | JSON settings/data. |
| `is_export` | tinyint(1) | Boolean flag (1/0). |
| `position` | varchar(191) | — |
| `customer_group_id` | int(11) | Customer group (group pricing). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 6. Sales, Purchases & Payments


## `transactions`  (103 columns)

The central document table — one row per sell, purchase, expense, payroll, transfer, adjustment, return, opening stock/balance, distinguished by type.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(10) | Which business location this row belongs to. |
| `is_kitchen_order` | tinyint(1) | 1 = sent to kitchen (restaurant). |
| `res_table_id` | int(10) | Restaurant table for the order. |
| `res_waiter_id` | int(10) | Foreign key → res_waiter. |
| `res_order_status` | enum('cooked','received','served') | — |
| `type` | varchar(191) | Document type: sell, purchase, expense, payroll, stock_adjustment, sell_transfer, purchase_transfer, opening_stock, opening_balance, sell_return, purchase_return. |
| `order_type` | varchar(225) | Type/kind selector. |
| `sub_type` | varchar(20) | Secondary kind/category. |
| `status` | varchar(191) | Document status (final / draft / pending / received / ordered / in_transit). |
| `sub_status` | varchar(191) | — |
| `is_quotation` | tinyint(1) | 1 = this draft is a quotation. |
| `payment_status` | enum('paid','due','partial') | paid / partial / due (derived from payments). |
| `adjustment_type` | smallint(6) | Type/kind selector. |
| `contact_id` | int(10) | Customer (for sell) or supplier (for purchase). |
| `customer_group_id` | int(11) | Foreign key → customer_group. |
| `invoice_no` | varchar(191) | Generated invoice number (from invoice scheme). |
| `ref_no` | varchar(191) | Reference number. |
| `source` | varchar(191) | — |
| `subscription_no` | varchar(191) | Recurring/subscription invoice identifier. |
| `subscription_repeat_on` | varchar(191) | — |
| `transaction_date` | datetime | Date. |
| `total_before_tax` | decimal(22,4) | Sum of line totals before tax. |
| `tax_id` | int(10) | Foreign key → tax. |
| `tax_amount` | decimal(22,4) | Total tax on the document. |
| `discount_type` | enum('fixed','percentage') | fixed or percentage. |
| `discount_amount` | decimal(22,4) | Overall discount value. |
| `rp_redeemed` | int(11) | Reward points redeemed. |
| `rp_redeemed_amount` | decimal(22,4) | Money/amount value. |
| `shipping_details` | varchar(191) | JSON settings/data. |
| `shipping_address` | text | Address text. |
| `delivery_date` | datetime | Date. |
| `shipping_status` | varchar(191) | — |
| `delivered_to` | varchar(191) | — |
| `delivery_person` | bigint(20) | — |
| `shipping_charges` | decimal(22,4) | — |
| `additional_notes` | text | Free-text note. |
| `staff_note` | text | Free-text note. |
| `is_export` | tinyint(1) | Boolean flag (1/0). |
| `export_custom_fields_info` | longtext | — |
| `round_off_amount` | decimal(22,4) | Money/amount value. |
| `additional_expense_key_1` | varchar(191) | — |
| `additional_expense_value_1` | decimal(22,4) | — |
| `additional_expense_key_2` | varchar(191) | — |
| `additional_expense_value_2` | decimal(22,4) | — |
| `additional_expense_key_3` | varchar(191) | — |
| `additional_expense_value_3` | decimal(22,4) | — |
| `additional_expense_key_4` | varchar(191) | — |
| `additional_expense_value_4` | decimal(22,4) | — |
| `final_total` | decimal(22,4) | Final payable/receivable amount after tax & discount. |
| `expense_category_id` | int(10) | Foreign key → expense_category. |
| `expense_sub_category_id` | int(11) | Foreign key → expense_sub_category. |
| `expense_for` | int(10) | For payroll/expense — the user/employee it is for. |
| `commission_agent` | int(11) | — |
| `document` | varchar(191) | — |
| `is_direct_sale` | tinyint(1) | 1 = created via "Add Sale" (not POS screen). |
| `is_suspend` | tinyint(1) | 1 = suspended POS ticket (saved, not finalised). |
| `exchange_rate` | decimal(20,3) | Currency exchange rate if purchased in another currency. |
| `total_amount_recovered` | decimal(22,4) | — |
| `transfer_parent_id` | int(11) | Links the two sides of a stock transfer. |
| `return_parent_id` | int(11) | For a return — the original transaction it reverses. |
| `opening_stock_product_id` | int(11) | Foreign key → opening_stock_product. |
| `created_by` | int(10) | User id who created this record. |
| `mfg_parent_production_purchase_id` | int(11) | Manufacturing: links produced stock to its production. |
| `mfg_wasted_units` | decimal(22,4) | — |
| `mfg_production_cost` | decimal(22,4) | Money/amount value. |
| `mfg_production_cost_type` | varchar(191) | Type/kind selector. |
| `mfg_is_final` | tinyint(1) | — |
| `essentials_duration` | decimal(8,2) | — |
| `essentials_duration_unit` | varchar(20) | — |
| `essentials_amount_per_unit_duration` | decimal(22,4) | — |
| `essentials_unit_salary` | decimal(22,4) | Payroll: base salary per unit period. |
| `essentials_allowances` | text | Payroll: JSON breakdown of allowances. |
| `essentials_deductions` | text | Payroll: JSON breakdown of deductions. |
| `purchase_requisition_ids` | text | — |
| `prefer_payment_method` | varchar(191) | — |
| `prefer_payment_account` | int(11) | — |
| `sales_order_ids` | text | — |
| `purchase_order_ids` | text | — |
| `import_batch` | int(11) | — |
| `import_time` | datetime | Time. |
| `types_of_service_id` | int(11) | Foreign key → types_of_service. |
| `packing_charge` | decimal(22,4) | Money/amount value. |
| `packing_charge_type` | enum('fixed','percent') | Type/kind selector. |
| `is_created_from_api` | tinyint(1) | Boolean flag (1/0). |
| `rp_earned` | int(11) | Reward points earned on this sale. |
| `order_addresses` | text | — |
| `is_recurring` | tinyint(1) | Boolean flag (1/0). |
| `recur_interval` | double(22,4) | — |
| `recur_interval_type` | enum('days','months','years') | Type/kind selector. |
| `recur_repetitions` | int(11) | — |
| `recur_stopped_on` | datetime | — |
| `recur_parent_id` | int(11) | Foreign key → recur_parent. |
| `invoice_token` | varchar(191) | — |
| `pay_term_number` | int(11) | Numeric value/count. |
| `pay_term_type` | enum('days','months') | Type/kind selector. |
| `selling_price_group_id` | int(11) | Price tier used for this sale. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |
| `is_approved` | int(11) | Boolean flag (1/0). |
| `approved_by` | int(11) | — |
| `approved_at` | datetime | Timestamp. |


## `transaction_sell_lines`  (31 columns)

Line items of a sell (sale) transaction.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `transaction_id` | int(10) | Related transaction (parent document). |
| `product_id` | int(10) | Related product. |
| `variation_id` | int(10) | Related product variation (the sellable unit). |
| `quantity` | decimal(22,4) | Quantity sold on this line. |
| `mfg_waste_percent` | decimal(22,4) | Percentage value. |
| `mfg_ingredient_group_id` | int(11) | Foreign key → mfg_ingredient_group. |
| `secondary_unit_quantity` | decimal(22,4) | Numeric value/count. |
| `quantity_returned` | decimal(20,4) | Quantity returned on this line. |
| `unit_price_before_discount` | decimal(22,4) | Unit price before line discount. |
| `unit_price` | decimal(22,4) | Unit price after line discount (excl. tax). |
| `line_discount_type` | enum('fixed','percentage') | fixed / percentage. |
| `line_discount_amount` | decimal(22,4) | Money/amount value. |
| `unit_price_inc_tax` | decimal(22,4) | Unit price incl. tax. |
| `item_tax` | decimal(22,4) | Tax amount per unit. |
| `tax_id` | int(10) | Foreign key → tax. |
| `discount_id` | int(11) | Foreign key → discount. |
| `lot_no_line_id` | int(11) | Foreign key → lot_no_line. |
| `sell_line_note` | text | Free-text note. |
| `so_line_id` | int(11) | Foreign key → so_line. |
| `so_quantity_invoiced` | decimal(22,4) | — |
| `res_service_staff_id` | int(11) | Waiter/service staff (restaurant). |
| `res_line_order_status` | varchar(191) | — |
| `parent_sell_line_id` | int(11) | Foreign key → parent_sell_line. |
| `children_type` | varchar(191) | Type/kind selector. |
| `sub_unit_id` | int(11) | Foreign key → sub_unit. |
| `issued_quantity` | decimal(20,4) | Numeric value/count. |
| `issued_date` | varchar(255) | Date. |
| `issued_status` | varchar(255) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `purchase_lines`  (27 columns)

Line items of a purchase (and opening-stock) transaction.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `transaction_id` | int(10) | Related transaction (parent document). |
| `product_id` | int(10) | Related product. |
| `variation_id` | int(10) | Related product variation (the sellable unit). |
| `received_quantity` | decimal(20,4) | Numeric value/count. |
| `received_date` | varchar(255) | Date. |
| `quantity` | decimal(22,4) | Quantity purchased. |
| `secondary_unit_quantity` | decimal(22,4) | Numeric value/count. |
| `pp_without_discount` | decimal(22,4) | — |
| `discount_percent` | decimal(5,2) | Percentage value. |
| `purchase_price` | decimal(22,4) | Unit purchase price (excl. tax). |
| `purchase_price_inc_tax` | decimal(22,4) | Unit purchase price incl. tax. |
| `item_tax` | decimal(22,4) | — |
| `tax_id` | int(10) | Foreign key → tax. |
| `purchase_requisition_line_id` | int(11) | Foreign key → purchase_requisition_line. |
| `purchase_order_line_id` | int(11) | Foreign key → purchase_order_line. |
| `quantity_sold` | decimal(22,4) | How much of this batch has been sold (FIFO). |
| `quantity_adjusted` | decimal(22,4) | How much removed via stock adjustment. |
| `quantity_returned` | decimal(22,4) | How much returned to supplier. |
| `po_quantity_purchased` | decimal(22,4) | — |
| `mfg_quantity_used` | decimal(22,4) | — |
| `mfg_date` | date | Date. |
| `exp_date` | date | Expiry date of the batch. |
| `lot_number` | varchar(191) | Batch/lot number. |
| `sub_unit_id` | int(11) | Foreign key → sub_unit. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `transaction_payments`  (30 columns)

Payments made or received against any transaction (sell/purchase/expense/payroll).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `transaction_id` | int(10) | Related transaction (parent document). |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `is_return` | tinyint(1) | 1 = this line is change/return given back. |
| `amount` | decimal(22,4) | Amount paid in this payment. |
| `method` | varchar(191) | cash / card / cheque / bank_transfer / custom / advance. |
| `payment_type` | varchar(191) | Type/kind selector. |
| `transaction_no` | varchar(191) | Numeric value/count. |
| `card_transaction_number` | varchar(191) | Numeric value/count. |
| `card_number` | varchar(191) | Numeric value/count. |
| `card_type` | varchar(191) | Type/kind selector. |
| `card_holder_name` | varchar(191) | — |
| `card_month` | varchar(191) | — |
| `card_year` | varchar(191) | — |
| `card_security` | varchar(5) | — |
| `cheque_number` | varchar(191) | Numeric value/count. |
| `bank_account_number` | varchar(191) | Numeric value/count. |
| `paid_on` | datetime | — |
| `created_by` | int(11) | User id who created this record. |
| `paid_through_link` | tinyint(1) | — |
| `gateway` | varchar(191) | Online gateway used (stripe/razorpay/paypal...). |
| `is_advance` | tinyint(1) | 1 = advance payment (not against a specific invoice). |
| `payment_for` | int(11) | — |
| `parent_id` | int(11) | Parent row id (self-reference for hierarchy). |
| `note` | varchar(191) | Free-text note. |
| `document` | varchar(191) | — |
| `payment_ref_no` | varchar(191) | Unique payment reference number. |
| `account_id` | int(11) | Which payment account received the money. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `transaction_sell_lines_purchase_lines`  (8 columns)

FIFO map — links a sold quantity to the purchase batch it was taken from (stock costing).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `sell_line_id` | int(10) | Foreign key → sell_line. |
| `stock_adjustment_line_id` | int(10) | Foreign key → stock_adjustment_line. |
| `purchase_line_id` | int(10) | Foreign key → purchase_line. |
| `quantity` | decimal(22,4) | — |
| `qty_returned` | decimal(22,4) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `sell_line_warranties`  (2 columns)

Pivot — warranty attached to a sold line.

| Column | Type | Meaning |
|---|---|---|
| `sell_line_id` | int(11) | Foreign key → sell_line. |
| `warranty_id` | int(11) | Foreign key → warranty. |


---

# 7. Inventory & Stock


## `variation_location_details`  (8 columns)

Live stock quantity of a variation at a location (the real inventory table).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `product_id` | int(10) | Related product. |
| `product_variation_id` | int(10) | Foreign key → product_variation. |
| `variation_id` | int(10) | Related product variation (the sellable unit). |
| `location_id` | int(10) | Which business location this row belongs to. |
| `qty_available` | decimal(22,4) | Current stock on hand for this variation at this location (THE live stock figure). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `product_locations`  (2 columns)

Pivot — which locations a product is available at.

| Column | Type | Meaning |
|---|---|---|
| `product_id` | int(11) | Related product. |
| `location_id` | int(11) | Which business location this row belongs to. |


## `product_racks`  (9 columns)

Product physical rack/row/position per location.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(10) | Which business location this row belongs to. |
| `product_id` | int(10) | Related product. |
| `rack` | varchar(191) | — |
| `row` | varchar(191) | — |
| `position` | varchar(191) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `stock_adjustment_lines`  (11 columns)

Line items of a stock-adjustment transaction.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `transaction_id` | int(10) | Related transaction (parent document). |
| `product_id` | int(10) | Related product. |
| `variation_id` | int(10) | Related product variation (the sellable unit). |
| `quantity` | decimal(22,4) | — |
| `secondary_unit_quantity` | decimal(22,4) | Numeric value/count. |
| `unit_price` | decimal(22,4) | Money/amount value. |
| `removed_purchase_line` | int(11) | — |
| `lot_no_line_id` | int(11) | Foreign key → lot_no_line. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `stock_adjustments_temp`  (1 columns)

Temporary table used while processing stock adjustments.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |


---

# 8. Tax, Pricing & Discounts


## `tax_rates`  (10 columns)

Tax rates and tax groups.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `amount` | double(22,4) | Money/quantity amount. |
| `is_tax_group` | tinyint(1) | 1 = this is a group of sub-taxes (e.g. GST = CGST+SGST). |
| `for_tax_group` | tinyint(1) | — |
| `created_by` | int(10) | User id who created this record. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `group_sub_taxes`  (2 columns)

Pivot — the sub-taxes contained inside a tax group.

| Column | Type | Meaning |
|---|---|---|
| `group_tax_id` | int(10) | Foreign key → group_tax. |
| `tax_id` | int(10) | Foreign key → tax. |


## `discounts`  (16 columns)

Time-bound automatic discounts by brand/category/location.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `brand_id` | int(11) | Foreign key → brand. |
| `category_id` | int(11) | Foreign key → category. |
| `location_id` | int(11) | Which business location this row belongs to. |
| `priority` | int(11) | Ordering/priority. |
| `discount_type` | varchar(191) | fixed / percentage. |
| `discount_amount` | decimal(22,4) | Money/amount value. |
| `starts_at` | datetime | Timestamp. |
| `ends_at` | datetime | Timestamp. |
| `is_active` | tinyint(1) | Boolean flag (1/0). |
| `spg` | varchar(100) | Selling price group the discount applies to. |
| `applicable_in_cg` | tinyint(1) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `discount_variations`  (2 columns)

Pivot — which product variations a discount applies to.

| Column | Type | Meaning |
|---|---|---|
| `discount_id` | int(11) | Foreign key → discount. |
| `variation_id` | int(11) | Related product variation (the sellable unit). |


---

# 9. Accounting, Cash & Expenses


## `accounts`  (12 columns)

Payment accounts (bank/cash) of a business; all payments post money here.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `account_number` | varchar(191) | Numeric value/count. |
| `account_details` | text | JSON settings/data. |
| `account_type_id` | int(11) | Foreign key → account_type. |
| `note` | text | Free-text note. |
| `created_by` | int(11) | User id who created this record. |
| `is_closed` | tinyint(1) | Boolean flag (1/0). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `account_transactions`  (15 columns)

Ledger entries for payment accounts — every credit/debit posted to a bank or cash account.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `account_id` | int(11) | Foreign key → account. |
| `type` | enum('debit','credit') | credit or debit. |
| `sub_type` | enum('opening_balance','fund_transfer','deposit') | Secondary kind/category. |
| `amount` | decimal(22,4) | Money/quantity amount. |
| `reff_no` | varchar(191) | Reference number. |
| `operation_date` | datetime | Date. |
| `created_by` | int(11) | User id who created this record. |
| `transaction_id` | int(11) | Related transaction (parent document). |
| `transaction_payment_id` | int(11) | Foreign key → transaction_payment. |
| `transfer_transaction_id` | int(11) | Foreign key → transfer_transaction. |
| `note` | text | Free-text note. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `account_types`  (6 columns)

Types/classification of accounts (e.g. asset, liability), can be hierarchical.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `parent_account_type_id` | int(11) | Foreign key → parent_account_type. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `cash_registers`  (13 columns)

POS cash-register sessions (open/close per cashier).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `user_id` | int(10) | Related user (employee/customer-user). |
| `status` | enum('close','open') | open or close. |
| `closed_at` | datetime | Timestamp. |
| `closing_amount` | decimal(22,4) | Money/amount value. |
| `total_card_slips` | int(11) | — |
| `total_cheques` | int(11) | — |
| `denominations` | text | — |
| `closing_note` | text | Free-text note. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `cash_register_transactions`  (9 columns)

Individual cash in/out entries inside a POS register session.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `cash_register_id` | int(10) | Foreign key → cash_register. |
| `amount` | decimal(22,4) | Money/quantity amount. |
| `pay_method` | varchar(191) | — |
| `type` | enum('debit','credit') | Kind/category selector for this row. |
| `transaction_type` | varchar(191) | Type/kind selector. |
| `transaction_id` | int(11) | Related transaction (parent document). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `cash_denominations`  (8 columns)

Cash counts split by note/coin denomination (used at register close).

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `amount` | decimal(22,4) | Money/quantity amount. |
| `total_count` | int(11) | Numeric value/count. |
| `model_type` | varchar(191) | Type/kind selector. |
| `model_id` | bigint(20) | Foreign key → model. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `expense_categories`  (8 columns)

Expense categories (hierarchical).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `code` | varchar(191) | Short code. |
| `parent_id` | int(11) | Parent row id (self-reference for hierarchy). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 10. Warranties, Services & Wastage


## `warranties`  (8 columns)

Warranty definitions (duration).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `description` | text | Free-text description. |
| `duration` | int(11) | — |
| `duration_type` | enum('days','months','years') | Type/kind selector. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `types_of_services`  (10 columns)

Service types (dine-in/takeaway/delivery) with packing charges.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `description` | text | Free-text description. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_price_group` | text | — |
| `packing_charge` | decimal(22,4) | Money/amount value. |
| `packing_charge_type` | enum('fixed','percent') | Type/kind selector. |
| `enable_custom_fields` | tinyint(1) | Setting/toggle (on/off). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `wastage_types`  (7 columns)

Wastage/spoilage reason types.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `name` | varchar(191) | Display name. |
| `created_by` | int(10) | User id who created this record. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 11. HR / Essentials


## `essentials_attendances`  (16 columns)

Employee clock-in/clock-out attendance records.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `clock_in_time` | datetime | Clock-in timestamp. |
| `clock_out_time` | datetime | Clock-out timestamp. |
| `essentials_shift_id` | int(11) | Foreign key → essentials_shift. |
| `essentials_activity_log` | int(11) | — |
| `ip_address` | varchar(191) | Address text. |
| `clock_in_note` | text | Free-text note. |
| `clock_out_note` | text | Free-text note. |
| `clock_in_location` | text | Geolocation at clock-in. |
| `clock_out_location` | text | — |
| `attendence_approve_status` | int(2) | — |
| `attendence_approve_by` | int(11) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_shifts`  (12 columns)

Work-shift definitions (timings, auto clock-out).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `type` | enum('fixed_shift','flexible_shift') | Kind/category selector for this row. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `start_time` | time | Time. |
| `end_time` | time | Time. |
| `shift_spend_time` | int(11) | Time. |
| `is_allowed_auto_clockout` | tinyint(1) | Boolean flag (1/0). |
| `auto_clockout_time` | time | Setting/toggle (on/off). |
| `holidays` | text | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_shifts`  (7 columns)

Shift assignment per user (which shift, date range).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `essentials_shift_id` | int(11) | Foreign key → essentials_shift. |
| `start_date` | date | Date. |
| `end_date` | date | Date. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_holidays`  (9 columns)

Company holiday calendar.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `start_date` | date | Date. |
| `end_date` | date | Date. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `note` | text | Free-text note. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_leave_types`  (9 columns)

Leave type master (paid/unpaid, quota, interval).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `leave_type` | varchar(191) | Type/kind selector. |
| `max_leave_count` | int(11) | Numeric value/count. |
| `leave_count_interval` | enum('month','year') | — |
| `type` | int(11) | Kind/category selector for this row. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `deleted_at` | varchar(255) | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_leaves`  (13 columns)

Leave applications and their approval status.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `essentials_leave_type_id` | int(11) | Foreign key → essentials_leave_type. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `start_date` | date | Date. |
| `end_date` | date | Date. |
| `ref_no` | varchar(191) | Reference number. |
| `status` | enum('pending','approved','cancelled') | pending / approved / cancelled. |
| `reason` | text | — |
| `status_note` | text | Free-text note. |
| `change_id` | int(11) | Foreign key → change. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_leave_and_deductions`  (8 columns)

Per-user leave entitlement and running balance.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `leave_id` | int(11) | Foreign key → leave. |
| `balance` | float(10,2) | Remaining leave balance for the user/leave type. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_leave_and_deductions_transactions`  (11 columns)

Leave-balance change ledger (additions/deductions).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `leave_type_id` | int(11) | Foreign key → leave_type. |
| `leave_id` | int(11) | Foreign key → leave. |
| `leave_type_deduction_id` | int(11) | Foreign key → leave_type_deduction. |
| `type` | enum('credit','debit') | Kind/category selector for this row. |
| `leave_count` | int(11) | Numeric value/count. |
| `added_date` | varchar(100) | Date. |
| `deleted_at` | datetime | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_payroll_groups`  (10 columns)

A batch/group of payroll runs (a payroll period).

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `name` | varchar(191) | Display name. |
| `status` | varchar(191) | Status of the record. |
| `payment_status` | varchar(191) | — |
| `gross_total` | decimal(22,4) | Money/amount value. |
| `created_by` | int(11) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_payroll_group_transactions`  (2 columns)

Pivot linking a payroll group to its payroll transactions.

| Column | Type | Meaning |
|---|---|---|
| `payroll_group_id` | bigint(20) | Foreign key → payroll_group. |
| `transaction_id` | int(11) | Related transaction (parent document). |


## `essentials_allowances_and_deductions`  (10 columns)

Salary allowance/deduction definitions (fixed or percent).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `description` | varchar(191) | Free-text description. |
| `type` | enum('allowance','deduction') | allowance or deduction. |
| `amount` | decimal(22,4) | Money/quantity amount. |
| `amount_type` | enum('fixed','percent','test') | fixed or percent. |
| `applicable_date` | date | Date. |
| `is_approved` | int(11) | Boolean flag (1/0). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_allowance_and_deductions`  (2 columns)

Pivot — allowance/deduction assigned to users.

| Column | Type | Meaning |
|---|---|---|
| `user_id` | int(11) | Related user (employee/customer-user). |
| `allowance_deduction_id` | int(11) | Foreign key → allowance_deduction. |


## `essentials_claim_and_reimbursement_categories`  (8 columns)

Categories for employee claims/reimbursements.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(255) | Display name. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `code` | varchar(255) | Short code. |
| `parent_id` | int(10) | Parent row id (self-reference for hierarchy). |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_claim_reimbursement`  (17 columns)

Employee claim/reimbursement records (feed payroll).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `payroll_id` | int(11) | Foreign key → payroll. |
| `description` | varchar(191) | Free-text description. |
| `type` | enum('allowance','deduction') | Kind/category selector for this row. |
| `amount` | decimal(22,4) | Money/quantity amount. |
| `amount_type` | enum('fixed','percent') | Type/kind selector. |
| `applicable_date` | date | Date. |
| `is_approved` | int(11) | Boolean flag (1/0). |
| `is_reimbursed` | tinyint(1) | Boolean flag (1/0). |
| `status_note` | varchar(255) | Free-text note. |
| `document` | varchar(255) | — |
| `claim_category_id` | int(11) | Foreign key → claim_category. |
| `claim_sub_category_id` | int(11) | Foreign key → claim_sub_category. |
| `change_id` | int(11) | Foreign key → change. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_claim_reimbursement`  (2 columns)

Pivot — claim/reimbursement assigned to a user.

| Column | Type | Meaning |
|---|---|---|
| `user_id` | int(11) | Related user (employee/customer-user). |
| `claim_reimbursement_id` | int(11) | Foreign key → claim_reimbursement. |


## `essentials_to_dos`  (13 columns)

HR tasks / to-dos.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `task` | text | — |
| `date` | datetime | Date. |
| `end_date` | datetime | Date. |
| `task_id` | varchar(191) | Foreign key → task. |
| `description` | text | Free-text description. |
| `status` | varchar(191) | Status of the record. |
| `estimated_hours` | varchar(191) | — |
| `priority` | varchar(191) | Ordering/priority. |
| `created_by` | int(11) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_todo_comments`  (6 columns)

Comments on to-do tasks.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `comment` | text | — |
| `task_id` | int(11) | Foreign key → task. |
| `comment_by` | int(11) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_todos_users`  (2 columns)

Pivot — to-do assignees.

| Column | Type | Meaning |
|---|---|---|
| `todo_id` | int(11) | Foreign key → todo. |
| `user_id` | int(11) | Related user (employee/customer-user). |


## `essentials_documents`  (8 columns)

HR documents stored per employee.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `type` | varchar(191) | Kind/category selector for this row. |
| `name` | varchar(191) | Display name. |
| `description` | varchar(191) | Free-text description. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_document_shares`  (6 columns)

Sharing rules for HR documents.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `document_id` | int(11) | Foreign key → document. |
| `value_type` | enum('user','role') | Type/kind selector. |
| `value` | int(11) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_kb`  (11 columns)

HR knowledge-base articles.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `business_id` | bigint(20) | Tenant — which business owns this row (multi-tenant scope). |
| `title` | varchar(191) | — |
| `content` | longtext | — |
| `status` | varchar(191) | Status of the record. |
| `kb_type` | varchar(191) | Type/kind selector. |
| `parent_id` | bigint(20) | Parent row id (self-reference for hierarchy). |
| `share_with` | varchar(191) | — |
| `created_by` | bigint(20) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_kb_users`  (3 columns)

Knowledge-base article visibility per user.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `kb_id` | int(11) | Foreign key → kb. |
| `user_id` | int(11) | Related user (employee/customer-user). |


## `essentials_messages`  (7 columns)

Internal HR messages/announcements.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `message` | text | — |
| `location_id` | int(11) | Which business location this row belongs to. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_reminders`  (10 columns)

Personal/HR reminders.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `name` | varchar(191) | Display name. |
| `date` | date | Date. |
| `time` | time | — |
| `end_time` | time | Time. |
| `repeat` | enum('one_time','every_day','every_week','every_month') | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_user_sales_targets`  (7 columns)

Sales targets per user (drive commission in payroll).

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `target_start` | decimal(22,4) | — |
| `target_end` | decimal(22,4) | — |
| `commission_percent` | decimal(22,4) | Percentage value. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `essentials_activity_logs`  (6 columns)

HR attendance activity codes (the task/activity an employee logs).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `activity_name` | varchar(255) | — |
| `activity_code` | varchar(255) | — |
| `status` | int(2) | Status of the record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 12. Training


## `trainings`  (11 columns)

Training content targeted at roles/designations (HR).

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `business_id` | bigint(20) | Tenant — which business owns this row (multi-tenant scope). |
| `role_id` | bigint(20) | Foreign key → role. |
| `designation_id` | int(11) | Foreign key → designation. |
| `title` | varchar(191) | — |
| `content` | longtext | — |
| `status` | varchar(191) | Status of the record. |
| `attachment` | longtext | — |
| `created_by` | bigint(20) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `training_docs`  (6 columns)

Attachments/links for a training.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint(20) | Primary key. |
| `training_id` | int(11) | Foreign key → training. |
| `title` | varchar(191) | — |
| `url` | longtext | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 13. Manufacturing


## `mfg_recipes`  (13 columns)

Manufacturing recipe for a product/variation (ingredients + costs).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `product_id` | int(11) | Related product. |
| `variation_id` | int(11) | Related product variation (the sellable unit). |
| `instructions` | text | — |
| `waste_percent` | decimal(10,2) | Percentage value. |
| `ingredients_cost` | decimal(22,4) | Money/amount value. |
| `extra_cost` | decimal(22,4) | Money/amount value. |
| `production_cost_type` | varchar(191) | Type/kind selector. |
| `total_quantity` | decimal(22,4) | Numeric value/count. |
| `final_price` | decimal(22,4) | Money/amount value. |
| `sub_unit_id` | int(11) | Foreign key → sub_unit. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `mfg_recipe_ingredients`  (10 columns)

Ingredients that make up a manufacturing recipe.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `mfg_recipe_id` | int(10) | Foreign key → mfg_recipe. |
| `variation_id` | int(11) | Related product variation (the sellable unit). |
| `mfg_ingredient_group_id` | int(11) | Foreign key → mfg_ingredient_group. |
| `quantity` | decimal(22,4) | Quantity of the ingredient needed. |
| `waste_percent` | decimal(22,4) | Expected wastage % for the ingredient. |
| `sub_unit_id` | int(11) | Foreign key → sub_unit. |
| `sort_order` | int(11) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `mfg_ingredient_groups`  (6 columns)

Manufacturing ingredient groups.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `name` | varchar(191) | Display name. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `description` | text | Free-text description. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 14. Document Sign


## `document_signs`  (11 columns)

DocumentSign master (title, file, status, type).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `title` | varchar(255) | — |
| `document` | varchar(255) | — |
| `description` | varchar(255) | Free-text description. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `type` | varchar(255) | Kind/category selector for this row. |
| `status` | int(11) | Status of the record. |
| `uploaded_by` | int(11) | — |
| `created_at` | datetime | Created timestamp. |
| `updated_at` | datetime | Last updated timestamp. |


## `document_sign_documents`  (7 columns)

Documents stored under the DocumentSign module.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `location_id` | int(11) | Which business location this row belongs to. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `document_id` | int(11) | Foreign key → document. |
| `document` | varchar(255) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `document_sign_receipts`  (12 columns)

Signed-document receipts/signatures captured.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(11) | Which business location this row belongs to. |
| `document_id` | int(11) | Foreign key → document. |
| `signed_document` | varchar(255) | — |
| `type` | varchar(255) | Kind/category selector for this row. |
| `email` | varchar(255) | Email address. |
| `user_id` | int(11) | Related user (employee/customer-user). |
| `sequence` | tinyint(4) | — |
| `signed_at` | datetime | Timestamp. |
| `created_at` | datetime | Created timestamp. |
| `updated_at` | datetime | Last updated timestamp. |


---

# 15. Restaurant


## `res_tables`  (9 columns)

Restaurant tables.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(10) | Which business location this row belongs to. |
| `name` | varchar(191) | Display name. |
| `description` | text | Free-text description. |
| `created_by` | int(10) | User id who created this record. |
| `deleted_at` | timestamp | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `res_product_modifier_sets`  (2 columns)

Pivot — modifier sets linked to products (restaurant).

| Column | Type | Meaning |
|---|---|---|
| `modifier_set_id` | int(10) | Foreign key → modifier_set. |
| `product_id` | int(10) | Related product. |


## `bookings`  (14 columns)

Restaurant table bookings/reservations.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `contact_id` | int(10) | Related contact (customer/supplier). |
| `waiter_id` | int(10) | Foreign key → waiter. |
| `table_id` | int(10) | Foreign key → table. |
| `correspondent_id` | int(11) | Foreign key → correspondent. |
| `business_id` | int(10) | Tenant — which business owns this row (multi-tenant scope). |
| `location_id` | int(10) | Which business location this row belongs to. |
| `booking_start` | datetime | — |
| `booking_end` | datetime | — |
| `created_by` | int(10) | User id who created this record. |
| `booking_status` | varchar(191) | — |
| `booking_note` | text | Free-text note. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 16. Custom Fields & Notes


## `custom_fields`  (19 columns)

Admin-defined custom field definitions (extra fields on products/contacts/etc.).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `fieldto` | varchar(30) | — |
| `name` | varchar(150) | Display name. |
| `slug` | text | URL-friendly key. |
| `required` | tinyint(1) | — |
| `type` | varchar(20) | Kind/category selector for this row. |
| `options` | mediumtext | — |
| `display_inline` | tinyint(1) | — |
| `field_order` | int(11) | — |
| `active` | int(11) | — |
| `show_on_pdf` | int(11) | Setting/toggle (on/off). |
| `only_admin` | tinyint(1) | — |
| `show_on_table` | tinyint(1) | Setting/toggle (on/off). |
| `bs_column` | int(11) | — |
| `default_value` | text | — |
| `disabled` | int(2) | — |
| `deleted_at` | varchar(255) | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `custom_field_masters`  (5 columns)

Master list for the custom-field feature groups.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `name` | varchar(255) | Display name. |
| `status` | int(11) | Status of the record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `custom_fields_values`  (8 columns)

Stored values of custom fields against a record.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(11) | Primary key. |
| `relid` | int(11) | — |
| `fieldid` | int(11) | — |
| `fieldto` | text | — |
| `value` | text | — |
| `deleted_at` | varchar(255) | Soft-delete timestamp (NULL = active). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `document_and_notes`  (10 columns)

Polymorphic notes/documents attached to any record.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `notable_id` | int(11) | Foreign key → notable. |
| `notable_type` | varchar(191) | Type/kind selector. |
| `heading` | text | — |
| `description` | text | Free-text description. |
| `is_private` | tinyint(1) | Boolean flag (1/0). |
| `created_by` | int(11) | User id who created this record. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


---

# 17. System & Misc


## `activity_log`  (13 columns)

Audit trail — who changed what and when (spatie/activitylog).

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `log_name` | varchar(191) | — |
| `description` | text | Free-text description. |
| `subject_id` | int(11) | Foreign key → subject. |
| `subject_type` | varchar(191) | Type/kind selector. |
| `event` | varchar(191) | — |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `causer_id` | int(11) | Foreign key → causer. |
| `causer_type` | varchar(191) | Type/kind selector. |
| `properties` | text | — |
| `batch_uuid` | char(36) | — |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `notifications`  (8 columns)

Laravel notifications log/queue.

| Column | Type | Meaning |
|---|---|---|
| `id` | char(36) | Primary key. |
| `type` | varchar(191) | Kind/category selector for this row. |
| `notifiable_type` | varchar(191) | Type/kind selector. |
| `notifiable_id` | bigint(20) | Foreign key → notifiable. |
| `data` | text | — |
| `read_at` | timestamp | Timestamp. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `notification_templates`  (14 columns)

Email/SMS/WhatsApp templates per business action.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `template_for` | varchar(191) | — |
| `email_body` | text | — |
| `sms_body` | text | — |
| `whatsapp_text` | text | Display/label text. |
| `subject` | varchar(191) | — |
| `cc` | varchar(191) | — |
| `bcc` | varchar(191) | — |
| `auto_send` | tinyint(1) | Setting/toggle (on/off). |
| `auto_send_sms` | tinyint(1) | Setting/toggle (on/off). |
| `auto_send_wa_notif` | tinyint(1) | Setting/toggle (on/off). |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |


## `media`  (10 columns)

Uploaded files (polymorphic) — images and documents.

| Column | Type | Meaning |
|---|---|---|
| `id` | int(10) | Primary key. |
| `business_id` | int(11) | Tenant — which business owns this row (multi-tenant scope). |
| `file_name` | varchar(191) | — |
| `description` | text | Free-text description. |
| `uploaded_by` | int(11) | — |
| `model_type` | varchar(191) | Type/kind selector. |
| `model_media_type` | varchar(191) | Type/kind selector. |
| `model_id` | bigint(20) | Foreign key → model. |
| `created_at` | timestamp | Created timestamp. |
| `updated_at` | timestamp | Last updated timestamp. |