# Kapiree Implementation Flow Diagrams

## Overview
This document contains interactive flow diagrams for the Kapiree pricing and cart implementation, showing user journeys, technical architecture, and implementation phases.

## 1. User Journey Flow

### Primary User Flow
```mermaid
graph TD
    A[Landing Page] --> B{User Action}
    B -->|View Pricing| C[Pricing Section]
    B -->|Add to Cart| D[Cart Page]
    
    C --> E{Select Plan/Credits}
    E -->|Base Plan| F[Add Subscription to Cart]
    E -->|Credit Pack| G[Add Credits to Cart]
    E -->|Add-ons| H[Add Storage/Team Access]
    
    F --> D
    G --> D
    H --> D
    
    D --> I{Authentication Status}
    I -->|Not Logged In| J[Auth Modal]
    I -->|Logged In| K[Review Cart]
    
    J --> L{Auth Choice}
    L -->|Sign Up| M[Create Account]
    L -->|Sign In| N[Login]
    L -->|Guest Checkout| O[Continue as Guest]
    
    M --> K
    N --> K
    O --> K
    
    K --> P[Checkout Process]
    P --> Q{Payment Type}
    
    Q -->|Subscription| R[Stripe Subscription Checkout]
    Q -->|One-time| S[Stripe Payment Checkout]
    
    R --> T[Payment Success]
    S --> T
    T --> U[Order Confirmation]
    U --> V[Send Order Confirmation Email]
    
    style A fill:#e1f5fe
    style T fill:#c8e6c9
    style U fill:#c8e6c9
    style V fill:#bbdefb
```

### Authentication Flow
```mermaid
graph TD
    A[User Clicks Auth CTA] --> B[Auth Modal Opens]
    B --> C{User Choice}
    
    C -->|Sign Up| D[Sign Up Form]
    C -->|Sign In| E[Sign In Form]
    C -->|Guest Checkout| F[Continue as Guest]
    
    D --> G[Email/Password Entry]
    E --> H[Credential Verification]
    
    G --> I[Supabase Auth.signUp]
    H --> J[Supabase Auth.signIn]
    
    I --> K{Verification}
    J --> L{Authentication}
    
    K -->|Success| M[Email Verification]
    M --> M1[Send Verification Email]
    K -->|Error| N[Show Error Message]
    
    L -->|Success| O[Set User Session]
    L -->|Error| P[Show Error Message]
    
    M --> Q[Account Created]
    O --> R[User Logged In]
    F --> S[Guest Session]
    
    Q --> T[Redirect to Cart]
    R --> T
    S --> T
    
    N --> D
    P --> E
    
    style A fill:#fff3e0
    style Q fill:#c8e6c9
    style R fill:#c8e6c9
    style S fill:#fff9c4
```

## 2. Technical Architecture Flow

### System Architecture
```mermaid
graph TB
    subgraph "Frontend (React)"
        A[Pricing Components]
        B[Cart Management]
        C[Auth Components]
        D[Payment UI]
    end
    
    subgraph "State Management"
        E[AuthContext]
        F[Cart State]
        G[User Session]
    end
    
    subgraph "Supabase Backend"
        H[Authentication]
        I[Database]
        J[Edge Functions]
        K[Row Level Security]
    end
    
    subgraph "External Services"
        L[Stripe Payments]
        M[Email Service]
    end
    
    A --> F
    B --> F
    C --> E
    D --> J
    
    E --> H
    F --> I
    G --> H
    
    J --> L
    J --> I
    H --> M
    
    I --> K
    
    style H fill:#4caf50
    style I fill:#2196f3
    style J fill:#ff9800
    style L fill:#9c27b0
```

### Email Content Management
Email content for all user notifications is managed in `server/emails/email_templates.js`. This file exports functions that generate the HTML/text content for each specific email type, allowing for easy customization and localization.

### Database Schema Flow
```mermaid
erDiagram
    users ||--o{ cart_items : owns
    users ||--o{ orders : places
    users ||--o{ subscribers : has
    
    users {
        uuid id PK
        string email
        timestamp created_at
        timestamp updated_at
    }
    
    cart_items {
        uuid id PK
        uuid user_id FK
        string session_id
        string item_type
        string item_name
        decimal price
        integer quantity
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    orders {
        uuid id PK
        uuid user_id FK
        string session_id
        decimal total_amount
        string status
        string stripe_session_id
        jsonb items
        timestamp created_at
    }
    
    subscribers {
        uuid id PK
        uuid user_id FK
        string email
        string stripe_customer_id
        boolean subscribed
        string subscription_tier
        timestamp subscription_end
        timestamp created_at
        timestamp updated_at
    }
```

## 3. Implementation Phases Flow

### Development Timeline
```mermaid
gantt
    title Kapiree Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Backend Setup
    Supabase Connection     :done, supabase, 2024-01-01, 1d
    Database Schema         :done, db, after supabase, 2d
    Authentication Setup    :active, auth, after db, 3d
    
    section Phase 2: Core Features
    Cart Persistence        :cart, after auth, 4d
    User Management         :user, after auth, 2d
    
    section Phase 3: Payments
    Stripe Integration      :stripe, after cart, 3d
    Payment Processing      :payment, after stripe, 4d
    
    section Phase 4: Enhancement
    Error Handling          :error, after payment, 2d
    UI Polish              :ui, after error, 3d
    
    section Phase 5: Advanced
    Analytics              :analytics, after ui, 2d
    Refunds & Cancellation :refund, after analytics, 3d
```

### Feature Dependencies
```mermaid
graph TD
    A[Supabase Setup] --> B[Authentication]
    A --> C[Database Schema]
    
    B --> D[User Session Management]
    C --> E[Cart Persistence]
    
    D --> F[Protected Routes]
    E --> G[Cart Operations]
    
    F --> H[Payment Processing]
    G --> H
    
    H --> I[Order Management]
    I --> J[Subscription Management]
    
    J --> K[Customer Portal]
    I --> L[Refund Processing]
    
    style A fill:#f44336
    style B fill:#ff9800
    style C fill:#ff9800
    style H fill:#4caf50
    style I fill:#2196f3
```

## 4. Payment Processing Flow

### Stripe Integration Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant E as Edge Function
    participant S as Stripe
    participant D as Database
    
    U->>F: Click "Checkout"
    F->>E: invoke('create-checkout')
    
    E->>D: Verify user session
    E->>S: Create checkout session
    S->>E: Return session URL
    E->>F: Return checkout URL
    
    F->>U: Redirect to Stripe
    U->>S: Complete payment
    S->>U: Redirect to success page
    
    U->>F: Load success page
    F->>E: invoke('verify-payment')
    E->>S: Verify payment status
    E->>D: Update order status
    E->>F: Return payment confirmation
    F->>U: Show success message
```

### Subscription Management Flow
```mermaid
graph TD
    A[User Subscribes] --> B[Stripe Creates Subscription]
    B --> C[Webhook/Verification Updates DB]
    C --> C1[Send Subscription Confirmation Email]
    C1 --> D[User Has Active Subscription]
    
    D --> E{User Action}
    E -->|Manage Subscription| F[Customer Portal]
    E -->|Cancel Subscription| G[Cancellation Flow]
    E -->|Upgrade/Downgrade| H[Plan Change]
    
    F --> I[Stripe Portal]
    I --> J[User Makes Changes]
    J --> K[Webhook Updates DB]
    
    G --> L{Cancellation Type}
    L -->|Immediate| M[Cancel Now + Refund]
    M --> M1[Send Cancellation Confirmation Email]
    L -->|End of Period| N[Cancel at Period End]
    N --> N1[Send Cancellation Confirmation Email]
    
    H --> O[Create New Subscription]
    O --> P[Cancel Old Subscription]
    P --> Q[Update User Record]
    Q --> Q1[Send Plan Change Confirmation Email]
    
    style A fill:#4caf50
    style M fill:#f44336
    style N fill:#ff9800
    style V fill:#bbdefb
    style M1 fill:#bbdefb
    style N1 fill:#bbdefb
    style Q1 fill:#bbdefb
```

## 5. Error Handling & Recovery Flow

### Error Scenarios
```mermaid
graph TD
    A[User Action] --> B{Action Type}
    
    B -->|Authentication| C[Auth Error]
    B -->|Payment| D[Payment Error]
    B -->|Database| E[DB Error]
    B -->|Network| F[Network Error]
    
    C --> G{Error Type}
    G -->|Invalid Credentials| H[Show Login Error]
    G -->|Account Locked| I[Account Recovery]
    G -->|Network| J[Retry Auth]
    
    D --> K{Payment Error}
    K -->|Card Declined| L[Payment Method Error]
    K -->|Insufficient Funds| M[Payment Failed]
    K -->|Stripe Error| N[Service Error]
    
    E --> O[Database Recovery]
    F --> P[Retry Mechanism]
    
    H --> Q[User Retry]
    I --> R[Recovery Process]
    L --> S[Update Payment Method]
    M --> T[Try Different Card]
    N --> U[Contact Support]
    O --> V[Fallback Options]
    P --> W[Auto Retry]
    
    style C fill:#ff5722
    style D fill:#ff5722
    style E fill:#ff5722
    style F fill:#ff5722
```

## 6. Data Flow Diagrams

### Cart State Management
```mermaid
graph LR
    A[User Adds Item] --> B[Update Local State]
    B --> C{User Authenticated?}
    
    C -->|Yes| D[Sync to Supabase]
    C -->|No| E[Store in localStorage]
    
    D --> F[Database Updated]
    E --> G[Local Storage Updated]
    
    F --> H[UI Reflects Changes]
    G --> H
    
    I[User Logs In] --> J[Merge Guest Cart]
    J --> K[Migrate to User Account]
    K --> L[Clear Guest Session]
    
    style A fill:#2196f3
    style H fill:#4caf50
    style J fill:#ff9800
```

### Authentication State Flow
```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticating : Login/SignUp
    Authenticating --> Authenticated : Success
    Authenticating --> Unauthenticated : Failure
    Authenticated --> Unauthenticated : Logout
    Authenticated --> Authenticating : Token Refresh
    
    state Authenticated {
        [*] --> LoadingProfile
        LoadingProfile --> ProfileLoaded
        ProfileLoaded --> SubscriptionCheck
        SubscriptionCheck --> ActiveSubscriber
        SubscriptionCheck --> FreeUser
    }
```

## 7. Performance & Optimization Flow

### Caching Strategy
```mermaid
graph TD
    A[User Request] --> B{Cache Check}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Fetch from API]
    
    D --> E[Update Cache]
    E --> F[Return Fresh Data]
    
    G[Cache Invalidation] --> H{Trigger Type}
    H -->|User Action| I[Selective Clear]
    H -->|Time Based| J[TTL Expiry]
    H -->|Data Change| K[Event Based Clear]
    
    style C fill:#4caf50
    style F fill:#2196f3
```

## Usage Instructions

1. **Implementation Planning**: Use the gantt chart and dependency flows to plan development phases
2. **User Experience Design**: Reference user journey flows for UX decisions
3. **Technical Architecture**: Use system diagrams for infrastructure planning
4. **Error Handling**: Follow error flow diagrams for robust error management
5. **Performance**: Implement caching strategies based on optimization flows

## Interactive Features

These diagrams can be enhanced with interactive React Flow components for:
- Clickable nodes leading to detailed documentation
- Real-time status updates during implementation
- Interactive tutorials for team onboarding
- Visual progress tracking

---

*This document serves as a visual companion to the main implementation specification and should be updated as the project evolves.*
