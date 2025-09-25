# Kapiree Pricing Plans Project

This project focuses on managing pricing plans, subscriptions, credit packs, and add-ons for Kapiree. It includes both a frontend (React/TypeScript) and a backend (Node.js/Express).

## Project Overview

The primary goal is to provide users with a comprehensive subscription management experience, allowing them to view their current plan, credit balance, active add-ons, and transaction history. It also facilitates the purchase of new plans, credit packs, and add-ons.

## Subscription Page (`src/pages/SubscriptionPage.tsx`)

The `SubscriptionPage.tsx` component is the central hub for user subscription management.

### Current Functionalities:
- Displays the user's current subscription plan, status, start/end dates, and auto-renew status.
- Lists features included in the current plan.
- Shows the overall `credit_balance` and details of individual `credit_packs` (name, remaining credits, total credits, expiration date).
- Presents active add-ons.
- Provides a transaction history table.
- Allows users to purchase more credit packs and browse add-ons through modals.
- Integrates with an authentication modal for unauthenticated users attempting to make a purchase.
- Fetches subscription data, available credit packs, add-ons, and plans from the backend via `src/lib/api.ts`.

### New Requirements:
- **Display Existing Credits:** Already covered by `credit_balance` and `credit_packs.credits_remaining`.
- **Display Expiry Date:** Already covered by `credit_packs.expiration_date`.
- **Display Pending Credits:** This is a new requirement that needs clarification.
- **New User Flow (First Month Free for Basic Plan):** When a new user logs in, they should automatically be assigned the basic plan with the first month free. The frontend needs to reflect this.

## API Integration (`src/lib/api.ts`)

The `api.ts` file provides a utility for making authenticated API requests to the backend. It handles token management (getting, setting, refreshing) and error handling. All data displayed on the `SubscriptionPage` is fetched through these API calls.

## Pending Clarifications and Future Enhancements

### 1. Definition of "Pending Credits"
- What exactly do "pending credits" refer to?
    - Are they credits from a recently purchased pack that are awaiting activation?
    - Are they credits that are part of a future subscription renewal?
    - Or is there another definition?
- Clarification is needed to determine if this requires a new field in the backend API or if it can be derived from existing data.

### 2. New User Free Plan Backend Implementation
- The "first one month free for the basic plan" for new users will likely require modifications to the backend authentication process to automatically assign this plan upon a new user's first login/signup.
- **Question:** Should I implement these backend changes as well, or should I focus only on the frontend display, assuming the backend will provide this information?

This `README.md` will be updated as the project progresses and new details emerge.
