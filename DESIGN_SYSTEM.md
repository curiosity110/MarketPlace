# Design System & Features Documentation

## 🎨 Color Palette

### Primary Colors

- **Orange**: `#FF6600` / `rgb(255, 102, 0)` - Main brand color (buttons, highlights)
- **Blue**: `#0366D6` / `rgb(3, 102, 214)` - Secondary color (graphs, info)
- **White**: Primary accent throughout

### Light Mode

- Background: `#FFFFFF`
- Foreground: `#111827` (dark gray)
- Card: `#FAFAFF` (off-white)
- Border: `#E2E8F0` (light gray)

### Dark Mode

- Background: `#0A0C14` (very dark blue)
- Foreground: `#F8FAFC` (off-white)
- Card: `#141928` (dark gray-blue)
- Border: `#334155` (slate)

## 📐 Layout & Spacing

### Container

- Max width: `1536px` (6xl)
- Padding: `1rem` (mobile to desktop)
- Responsive margins on hero sections

### Grid Layouts

- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns
- Gap: `1rem` between items

## 🎯 Key Components

### Button

**Props**: `variant`, `size`

**Variants**:

- `default` - Orange background, white text (primary action)
- `secondary` - Blue background, white text
- `outline` - Orange border, transparent background
- `ghost` - No background, orange text on hover
- `destructive` - Red background

**Sizes**:

- `sm` - Compact padding, small text
- `md` - Default padding
- `lg` - Large padding for hero sections

### Card

Rounded corners (`xl`), subtle shadow, hover effects with smooth transitions

**Subcomponents**:

- `CardHeader` - Top section with padding
- `CardTitle` - Large bold heading
- `CardDescription` - Muted subtitle
- `CardContent` - Main content area

### Input & Select

- Border: 2px (not 1px)
- Rounded corners: `lg`
- Focus state: Primary color ring + border change
- Hover state: Border opacity change

### Badge

**Variants**:

- `default` - Gray
- `primary` - Orange
- `secondary` - Blue
- `success` - Green
- `warning` - Yellow
- `destructive` - Red

## 🌐 Page Designs

### Homepage

1. **Hero Section**
   - Full-width gradient background
   - Large headline with gradient text
   - Feature grid (3 items)
   - CTA buttons

2. **Pricing Section**
   - Two pricing cards side-by-side
   - $4 per listing vs $30/month
   - Feature lists with checkmarks
   - "Most Popular" badge on premium

3. **Latest Listings**
   - Responsive grid of listing cards
   - Call-to-action button at bottom

### Categories Page

- Category cards with icons and subcategories
- Search functionality
- Grid responsive layout
- Direct links to browse by category

### Sell Page

- Hero header with description
- Create listing form card
- Tabs for Drafts/Active listings
- Grid view of seller's listings

### Admin Subscriptions

- KPI cards (4 total)
- Revenue chart with dual-line visualization
- Subscriber table showing active plans
- Status indicators

### Login Page

- Centered card layout
- Magic link authentication
- Trust indicators
- Link to signup

## ✨ Special Effects

### Animations

- `fadeIn` - Smooth opacity and slide up
- `slideInFromLeft/Right` - Directional entrance
- `pulse` - Opacity pulse effect
- `shimmer` - Loading state animation

### Hover Effects

- `scale-105` - Card scale on hover
- `shadow-lg` - Enhanced shadow
- `opacity-80` - Slight transparency
- `translate-y` - Lift effect

### Glass Morphism

- Semi-transparent background
- Backdrop blur effect
- Subtle border
- Dark mode variant

## 🛠️ Responsive Design

### Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `md` (640px - 1024px)
- **Desktop**: `lg` (1025px+)

### Mobile-First Approach

- Single column layouts stack by default
- Grid columns increase on larger screens
- Navigation adapts with hamburger menu
- Full-width buttons on mobile

## 🤖 AI Helper

### Features

- Floating button in bottom-right
- Chat modal window
- Real-time responses via GPT-4
- Context-aware prompts
- Bounce animation to draw attention
- Drag-friendly position

### Contexts

- **Homepage**: General marketplace help
- **Sell Page**: Writing product descriptions
- **Browse**: Finding products
- **Admin**: Understanding analytics

## 💰 Pricing Model

### Pay Per Listing

- **Cost**: $4 per listing
- **Duration**: 30 days
- **Features**:
  - 1 item listing
  - AI writing assistant
  - Photo uploads
  - Basic analytics

### Premium Subscription

- **Cost**: $30/month
- **Features**:
  - Unlimited listings
  - Priority AI assistant
  - Advanced analytics
  - Higher search visibility
  - 24/7 seller support

## 📊 Admin Features

### Subscriptions Dashboard

- Total revenue tracking
- Monthly subscriber count
- Pay-per-listing sales count
- Active sellers count
- Revenue trend chart (6-month)
- Active subscriber table
- Plan breakdown (premium vs PPL)

## 🎭 Theme Switching

- Uses `next-themes` library
- System preference detection
- Smooth transitions (0.3s)
- Persists user preference
- No flash on page load

## 📱 Mobile Optimization

- Touch-friendly button sizes
- Full-width form inputs
- Readable font sizes (16px minimum)
- Adequate spacing between elements
- Vertical scrolling preferred
- Collapsible navigation

## ♿ Accessibility

- Focus ring states on all interactive elements
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Loading states clearly marked

## 🔌 Integration Points

### API Endpoints

- `GET /api/listings` - Browse listings
- `POST /api/listings` - Create listing
- `POST /api/ai/chat` - AI assistant requests
- `GET /admin/subscriptions` - Subscription data

### Database Considerations

- User subscription plan tracking
- Listing expiration after 30 days
- Analytics aggregation for charts
- Payment history logging

## 🚀 Performance Optimizations

- Server-side rendering where possible
- Image lazy loading
- CSS animations (GPU-accelerated)
- Smooth scrolling
- Optimized hover states
- Efficient grid rendering

---

**Color Codes for Reference:**

- Primary Orange: `#FF6600`
- Secondary Blue: `#0366D6`
- Success Green: `#22C55E`
- Warning Yellow: `#F59E0B`
- Destructive Red: `#EF4444`
- Info Blue: `#3B82F6`
