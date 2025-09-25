CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    credits INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    `interval` VARCHAR(50) NOT NULL, -- e.g., 'month', 'year'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS features (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_features (
    plan_id VARCHAR(36) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id VARCHAR(36) NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(36) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- e.g., 'active', 'cancelled', 'past_due'
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_packs_definition (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    credits_amount INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    validity_days INT, -- NULL for no expiration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_credit_packs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_pack_def_id VARCHAR(36) NOT NULL REFERENCES credit_packs_definition(id) ON DELETE CASCADE,
    credits_remaining INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS add_ons_definition (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    `interval` VARCHAR(50), -- e.g., 'month', 'year', NULL for one-time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_add_ons (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    add_on_def_id VARCHAR(36) NOT NULL REFERENCES add_ons_definition(id) ON DELETE CASCADE,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP, -- NULL for perpetual or tied to subscription
    status VARCHAR(50) NOT NULL, -- e.g., 'active', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- e.g., 'subscription', 'credit_pack', 'add_on'
    item_id VARCHAR(36) NOT NULL, -- ID of the purchased item (subscription_id, user_credit_pack_id, user_add_on_id)
    item_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- e.g., 'New Subscription', 'Renewal', 'Cancellation', 'Purchase'
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- e.g., 'Completed', 'Pending', 'Failed', 'Refunded'
    invoice_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data for Plans
INSERT IGNORE INTO plans (id, name, description, price, currency, `interval`) VALUES
('plan_basic', 'Basic Plan', 'Essential features for everyday use.', 9.99, 'USD', 'month'),
('plan_pro', 'Pro Plan', 'Advanced features for power users.', 29.99, 'USD', 'month'),
('plan_premium', 'Premium Plan', 'All features, top-tier support.', 99.99, 'USD', 'year');

-- Initial Data for Features
INSERT IGNORE INTO features (id, name, description) VALUES
('feat_storage_10gb', '10GB Storage', 'Provides 10GB of cloud storage.'),
('feat_analytics', 'Basic Analytics', 'Access to basic usage statistics.'),
('feat_support_email', 'Email Support', 'Standard email support during business hours.'),
('feat_storage_100gb', '100GB Storage', 'Provides 100GB of cloud storage.'),
('feat_advanced_analytics', 'Advanced Analytics', 'In-depth usage statistics and reporting.'),
('feat_priority_support', 'Priority Support', '24/7 dedicated support with faster response times.');

-- Initial Data for Plan Features
INSERT IGNORE INTO plan_features (plan_id, feature_id) VALUES
('plan_basic', 'feat_storage_10gb'),
('plan_basic', 'feat_analytics'),
('plan_basic', 'feat_support_email'),
('plan_pro', 'feat_storage_100gb'),
('plan_pro', 'feat_advanced_analytics'),
('plan_pro', 'feat_priority_support'),
('plan_premium', 'feat_storage_100gb'),
('plan_premium', 'feat_advanced_analytics'),
('plan_premium', 'feat_priority_support');

-- Initial Data for Credit Packs Definition
INSERT IGNORE INTO credit_packs_definition (id, name, description, credits_amount, price, currency, validity_days) VALUES
('cp_100', '100 Credits Pack', '100 credits for various services.', 100, 5.00, 'USD', 365),
('cp_500', '500 Credits Pack', '500 credits for various services.', 500, 20.00, 'USD', 730),
('cp_unlimited', 'Unlimited Credits', 'Unlimited credits, no expiration.', 999999, 50.00, 'USD', NULL);

-- Initial Data for Add-ons Definition
INSERT IGNORE INTO add_ons_definition (id, name, description, price, currency, `interval`) VALUES
('ao_priority_support', 'Priority Support Add-on', 'Get 24/7 priority support.', 10.00, 'USD', 'month'),
('ao_extra_storage_50gb', 'Extra 50GB Storage', 'Additional 50GB cloud storage.', 5.00, 'USD', 'month'),
('ao_custom_branding', 'Custom Branding', 'Remove "Powered by" and add your logo.', 15.00, 'USD', 'month');

-- New Tables for Role-Based Access Control (RBAC)

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'jobs:view', 'users:manage'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(36) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(36) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Initial Data for Roles
INSERT IGNORE INTO roles (id, name, description) VALUES
('role_tenant_admin', 'Tenant Admin', 'Administrator with full control over their tenant.'),
('role_recruiter', 'Recruiter', 'Manages job postings, candidates, and interviews.'),
('role_hiring_manager', 'Hiring Manager', 'Reviews candidates and provides feedback.'),
('role_candidate', 'Candidate', 'Applies for jobs and participates in interviews.');

-- Initial Data for Permissions (ATS specific)
INSERT IGNORE INTO permissions (id, name, description) VALUES
('perm_dashboard:view', 'View Dashboard', 'Allows viewing the main dashboard.'),
('perm_jobs:view', 'View Job Positions', 'Allows viewing job postings.'),
('perm_jobs:create', 'Create Job Positions', 'Allows creating new job postings.'),
('perm_jobs:edit', 'Edit Job Positions', 'Allows editing existing job postings.'),
('perm_jobs:delete', 'Delete Job Positions', 'Allows deleting job postings.'),
('perm_candidates:view', 'View Candidates', 'Allows viewing candidate profiles.'),
('perm_candidates:edit', 'Edit Candidates', 'Allows editing candidate profiles.'),
('perm_interviews:schedule', 'Schedule Interviews', 'Allows scheduling video interviews.'),
('perm_interviews:conduct', 'Conduct Interviews', 'Allows conducting live video interviews.'),
('perm_interviews:review', 'Review Interviews', 'Allows reviewing recorded interviews and providing feedback.'),
('perm_users:manage', 'Manage Users', 'Allows creating, editing, and deleting user accounts within the tenant.'),
('perm_tenants:manage', 'Manage Tenants', 'Allows managing tenant-specific configurations.'),
('perm_subscriptions:view', 'View Subscriptions', 'Allows viewing subscription details.'),
('perm_subscriptions:manage', 'Manage Subscriptions', 'Allows managing subscription plans and billing.'),
('perm_pricing_plans:view', 'View Pricing Plans', 'Allows viewing available pricing plans.'),
('perm_pricing_plans:manage', 'Manage Pricing Plans', 'Allows managing pricing plan definitions.'),
('perm_roles:manage', 'Manage Roles', 'Allows creating, editing, and deleting roles and their permissions.');

-- Assign Permissions to Roles

-- Tenant Admin Role Permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_tenant_admin', 'perm_roles:manage'),
('role_tenant_admin', 'perm_dashboard:view'),
('role_tenant_admin', 'perm_jobs:view'),
('role_tenant_admin', 'perm_jobs:create'),
('role_tenant_admin', 'perm_jobs:edit'),
('role_tenant_admin', 'perm_jobs:delete'),
('role_tenant_admin', 'perm_candidates:view'),
('role_tenant_admin', 'perm_candidates:edit'),
('role_tenant_admin', 'perm_interviews:schedule'),
('role_tenant_admin', 'perm_interviews:conduct'),
('role_tenant_admin', 'perm_interviews:review'),
('role_tenant_admin', 'perm_users:manage'),
('role_tenant_admin', 'perm_tenants:manage'),
('role_tenant_admin', 'perm_subscriptions:view'),
('role_tenant_admin', 'perm_subscriptions:manage'),
('role_tenant_admin', 'perm_pricing_plans:view'),
('role_tenant_admin', 'perm_pricing_plans:manage');

-- Recruiter Role Permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_recruiter', 'perm_dashboard:view'),
('role_recruiter', 'perm_jobs:view'),
('role_recruiter', 'perm_jobs:create'),
('role_recruiter', 'perm_jobs:edit'),
('role_recruiter', 'perm_candidates:view'),
('role_recruiter', 'perm_candidates:edit'),
('role_recruiter', 'perm_interviews:schedule'),
('role_recruiter', 'perm_interviews:conduct'),
('role_recruiter', 'perm_interviews:review');

-- Hiring Manager Role Permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_hiring_manager', 'perm_dashboard:view'),
('role_hiring_manager', 'perm_jobs:view'),
('role_hiring_manager', 'perm_candidates:view'),
('role_hiring_manager', 'perm_interviews:review');

-- Candidate Role Permissions (minimal access)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
('role_candidate', 'perm_dashboard:view'); -- Can view their own dashboard/applications
