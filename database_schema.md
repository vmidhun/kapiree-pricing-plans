# User Management System - Database Schema

This document outlines the database schema for the user management system.

## 1. Users Table

Stores user details.

-   `id`: Primary Key (e.g., UUID, SERIAL)
-   `first_name`: VARCHAR
-   `last_name`: VARCHAR
-   `email`: VARCHAR (Unique)
-   `password`: VARCHAR (Hashed)
-   `role_id`: Foreign Key (references `Roles.id`)
-   `company_id`: Foreign Key (references `Companies.id`)
-   `is_active`: BOOLEAN (default: `true`)
-   `created_at`: TIMESTAMP
-   `updated_at`: TIMESTAMP

## 2. Roles Table

Defines user roles within the system.

-   `id`: Primary Key (e.g., SERIAL)
-   `name`: VARCHAR (Unique, e.g., 'super_admin', 'company_admin', 'team_member')
-   `description`: TEXT

## 3. Companies Table

Manages company/client information.

-   `id`: Primary Key (e.g., UUID, SERIAL)
-   `name`: VARCHAR
-   `admin_user_id`: Foreign Key (references `Users.id`)
-   `created_at`: TIMESTAMP
-   `updated_at`: TIMESTAMP
