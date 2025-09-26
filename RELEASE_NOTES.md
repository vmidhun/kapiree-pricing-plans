## Release Notes - Release-V1.1-25-Sep-2025 (Internal)
## Git Branch Release-V1.1-25-Sep-2025
This release focuses on enhancing user authentication security and providing essential account recovery features, alongside existing core functionalities.

**New Features & Improvements:**

*   **Enhanced Session Management:**
    *   **Automatic Session Logout:** The application now automatically logs out users and redirects them to the sign-in page upon token expiration, invalidity, or detection of backend restart/unavailability (e.g., 500 errors from API calls). This improves security and ensures data integrity.
*   **Forgot/Reset Password Functionality:**
    *   Users can now initiate a password reset process from the login page.
    *   A secure, time-limited password reset link is sent to the user's registered email address.
    *   Users can set a new password using the provided link, which invalidates the reset token after use.
*   **Improved Error Handling:**
    *   Client-side API calls (`src/lib/api.ts`) now robustly handle authentication errors (401, 403) and server errors (500), triggering appropriate logout actions.
*   **Refactored Authentication Context:**
    *   The `AuthProvider` and `AuthContext` have been restructured for better integration with the application's routing and API layer, resolving previous navigation and rendering issues.

**Existing Core Features:**

*   **User Authentication:**
    *   User registration and login with secure password hashing.
    *   Role-Based Access Control (RBAC) with permissions for different user roles (Super Admin, Tenant Admin, Recruiter, Hiring Manager, Candidate).
    *   User profile management.
*   **Subscription & Billing Management:**
    *   Viewing current subscription details, credit balance, active credit packs, and add-ons.
    *   Subscription renewal and cancellation.
    *   Purchase of credit packs and add-ons.
    *   Transaction history tracking.
*   **Tenant Management:**
    *   Creation of new tenants upon user registration.
    *   Management of tenant-specific configurations (Admin-only).
*   **ATS (Applicant Tracking System) Features:**
    *   Job Positions Management (view, create, edit, delete).
    *   Candidate Management (view, edit).
    *   Interview Scheduling, Conducting, and Reviewing.
*   **User & Role Management:**
    *   Admin functionalities for managing user accounts (create, edit, delete).
    *   Role management (create, edit, delete roles and assign permissions).
*   **Reporting & Analytics:**
    *   Placeholder for future reporting and analytics features.
*   **Responsive UI:**
    *   Modern and responsive user interface built with React and Shadcn UI components.

**Known Issues / Future Enhancements:**

*   Email configuration for password reset currently uses `nodemailer` with `ethereal.email` for testing. For production, a real SMTP service should be configured in `server/.env`.
*   Further hardening of security measures, such as rate limiting for password reset requests, can be considered.

This release significantly improves the application's security and user experience around authentication and account recovery.
