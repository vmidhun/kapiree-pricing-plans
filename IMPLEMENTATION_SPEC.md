# Kapiree Pricing & Cart Implementation Specification

## Project Overview
A complete pricing page with shopping cart functionality for Kapiree's video interview platform, including user authentication and payment processing.

## Current State Analysis

### ✅ Completed Components
- **PricingHero**: Main hero section with branding
- **PricingCard**: Reusable pricing card component with gradient styling
- **CreditCard**: Credit pack display component with purchase options
- **AddOns**: Additional services display (Extra Storage, Team Access)
- **StoragePolicy**: Storage policy information display
- **Cart Page**: Complete cart interface with item management
- **AuthModal**: Sign-in/sign-up modal with guest checkout option
- **Routing**: React Router setup with all necessary routes

### 🎯 Current Features
- Responsive pricing layout (2-column: Base Plan + Credit Packs)
- Interactive credit pack selection (30 credits/$25, 150 credits/$100)
- Add-ons selection (Extra Storage $5/month, Team Access $15/month)
- Shopping cart with quantity management
- Mock authentication flow
- Order summary with total calculation
- Guest checkout option

## Required Implementation

### Phase 1: Backend Setup (PREREQUISITE)
**⚠️ CRITICAL: Must connect to Supabase first**

#### 1.1 Supabase Integration
- Click the green Supabase button in top-right interface
- Connect to Supabase project
- Enable required services:
  - Authentication (email/password)
  - Database (for cart persistence, user data)
  - Edge Functions (for payment processing)

#### 1.2 Database Schema
```sql
-- Users table (handled by Supabase Auth)
-- Additional tables needed:

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest carts
  item_type TEXT NOT NULL, -- 'plan', 'credits', 'addon'
  item_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB, -- Additional item details
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For guest orders
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  stripe_session_id TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', true));
```

### Phase 2: Authentication Enhancement

#### 2.1 Real Authentication Flow
- Replace mock authentication with Supabase Auth
- Implement proper session management
- Add password reset functionality
- Email verification flow

#### 2.2 User Context
```typescript
// AuthContext enhancement needed
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, metadata?: object) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

### Phase 3: Cart Persistence

#### 3.1 Cart State Management
- Persist cart to Supabase for authenticated users
- Use localStorage for guest sessions
- Sync cart on authentication state change
- Handle cart merging (guest → authenticated)

#### 3.2 Cart API Functions
```typescript
// Required cart operations
interface CartAPI {
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCart: () => Promise<CartItem[]>;
  migrateGuestCart: (userId: string) => Promise<void>;
}
```

### Phase 4: Payment Integration

#### 4.1 Stripe Setup Requirements
Before implementing payments, user must provide:
- Stripe Secret Key (from Stripe Dashboard)
- Desired pricing structure confirmation
- Success/cancel redirect URLs

#### 4.2 Payment Types Needed
- **Subscription**: Base Plan ($10/month)
- **One-time**: Credit Packs (30 credits/$25, 150 credits/$100)
- **Add-ons**: Extra Storage ($5/month), Team Access ($15/month)

#### 4.3 Edge Functions Required
```typescript
// Edge functions to implement
1. create-checkout (for subscriptions)
2. create-payment (for one-time purchases)
3. customer-portal (for subscription management)
4. verify-payment (payment status verification)
```

### Phase 5: UI/UX Enhancements

#### 5.1 Loading States
- Add loading spinners for all async operations
- Skeleton loaders for cart items
- Payment processing indicators

#### 5.2 Error Handling
- Network error handling
- Payment failure scenarios
- Form validation improvements
- Toast notifications for user feedback

#### 5.3 Responsive Design
- Mobile cart optimization
- Touch-friendly interactions
- Accessible navigation

### Phase 6: Advanced Features

#### 6.1 Cart Analytics
- Track cart abandonment
- Popular item combinations
- Conversion funnel analysis

#### 6.2 Marketing Features
- Discount codes/coupons
- Limited-time offers
- Upselling suggestions

#### 6.3 Customer Support
- Live chat integration
- FAQ section
- Help tooltips

## Technical Requirements

### Frontend Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "@stripe/stripe-js": "^2.x",
  "react-query": "^4.x", // For data fetching
  "zustand": "^4.x" // For cart state management (optional)
}
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Supabase Edge Functions Environment
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Implementation Priority

### High Priority (MVP)
1. ✅ Supabase connection
2. Real authentication flow
3. Cart persistence
4. Basic payment processing
5. Order confirmation

### Medium Priority
1. Subscription management
2. Enhanced error handling
3. Mobile optimization
4. Email notifications

### Low Priority (Future)
1. Advanced analytics
2. Marketing features
3. A/B testing
4. Performance optimization

## Success Metrics

### Technical KPIs
- Page load time < 2s
- Cart abandonment rate < 70%
- Payment success rate > 95%
- Authentication conversion > 60%

### Business KPIs
- Credit pack conversion rate
- Subscription signup rate
- Average order value
- Customer lifetime value

## Dependencies & Blockers

### Critical Dependencies
1. **Supabase Connection**: Must be established before any backend work
2. **Stripe Account**: Required for payment processing
3. **Domain Setup**: For production deployment
4. **Email Service**: For transactional emails

### Potential Blockers
- Payment gateway approval process
- Email deliverability setup
- GDPR compliance requirements
- PCI DSS compliance for payment handling

## Testing Strategy

### Unit Tests
- Component rendering
- Cart logic functions
- Authentication flows

### Integration Tests
- Payment processing
- Database operations
- Authentication integration

### E2E Tests
- Complete purchase flow
- Authentication scenarios
- Mobile responsiveness

## Deployment Checklist

### Pre-Production
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe test mode verified
- [ ] Email templates configured
- [ ] Error monitoring setup

### Production
- [ ] Stripe live mode enabled
- [ ] SSL certificate configured
- [ ] CDN setup for assets
- [ ] Monitoring dashboards active
- [ ] Backup strategy implemented

## Next Steps

1. **Immediate**: Connect to Supabase using the green button
2. **Phase 1**: Set up authentication and database schema
3. **Phase 2**: Implement cart persistence
4. **Phase 3**: Add Stripe payment processing
5. **Phase 4**: Testing and optimization

---

*This specification serves as a living document and should be updated as requirements evolve during implementation.*