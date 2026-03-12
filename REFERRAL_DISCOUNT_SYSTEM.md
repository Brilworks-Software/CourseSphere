# Affiliate Referral Discount System

## Overview

The affiliate system now includes an **instant 10% referral discount** for customers who use valid affiliate links. This benefits both customers (instant savings) and affiliates (more attractive offer to promote).

## How It Works

### For Customers:
1. **Click affiliate link**: `/course/[courseId]?ref=ABC12345`
2. **Automatic discount**: 10% discount automatically detected and applied
3. **Stack with coupons**: Can still apply coupon codes for additional savings
4. **Clear pricing**: See detailed price breakdown with all savings

### For Affiliates:
1. **More attractive offer**: 10% instant discount makes links more appealing
2. **Higher conversions**: Immediate discounts increase purchase likelihood  
3. **Fair commission**: Earn 20% on the final amount customer actually pays
4. **Transparent tracking**: All referral discounts tracked in system

## Technical Implementation

### API Endpoints

#### `/api/affiliate/validate-discount` (POST)
Validates referral codes and returns discount information before purchase.

**Request:**
```json
{
  "affiliateCode": "ABC12345",
  "userId": "user-uuid", 
  "courseId": "course-uuid"
}
```

**Response:**
```json
{
  "valid": true,
  "discount": {
    "type": "referral",
    "percentage": 10,
    "originalPrice": 5000,
    "discountAmount": 500,
    "finalPrice": 4500,
    "savings": 500,
    "affiliateCode": "ABC12345"
  }
}
```

### Updated Payment Flow

#### 1. Order Creation (`/api/payments/create-order`)
- **Referral discount applied first**: 10% off original price
- **Coupon discount applied second**: On the already-discounted price
- **Example**: ₹5000 course → ₹4500 (referral) → ₹4050 (10% coupon on ₹4500)

#### 2. Commission Calculation
- **Fair commission**: 20% calculated on final purchase amount
- **Example**: Customer pays ₹4050 → Affiliate earns ₹810 (20% of ₹4050)

### Frontend Integration

#### Enhanced `EnrollButton` Component
- **Automatic detection**: Checks for referral codes on page load
- **Visual feedback**: Shows referral discount prominently
- **Price breakdown**: Clear display of all discounts and savings
- **Stacking support**: Works alongside existing coupon system

## Benefits

### For Customers ✅
- **Instant 10% savings** on all affiliate referrals
- **Stack discounts** - referral + coupon codes
- **Transparent pricing** with clear breakdown
- **No additional steps** - discount applies automatically

### For Affiliates 🚀
- **More attractive offer** to promote (instant discount)
- **Higher conversion rates** due to immediate savings
- **Fair commission structure** (earn on actual payment)
- **Professional presentation** with clear discount display

### For Platform 📈
- **Increased sales volume** through affiliate network
- **Higher conversion rates** from referral traffic
- **Competitive advantage** with instant discount offers
- **Transparent pricing** builds trust with customers

## Usage Examples

### Scenario 1: Referral Only
- Course Price: ₹5,000
- Referral Discount (10%): -₹500
- **Final Price: ₹4,500**
- **Customer Saves: ₹500**
- **Affiliate Earns: ₹900 (20% of ₹4,500)**

### Scenario 2: Referral + Coupon
- Course Price: ₹5,000
- Referral Discount (10%): -₹500
- Price after referral: ₹4,500
- Coupon Discount (15% on ₹4,500): -₹675
- **Final Price: ₹3,825**
- **Customer Saves: ₹1,175 total**
- **Affiliate Earns: ₹765 (20% of ₹3,825)**

## Configuration

### Environment Variables
```bash
# Referral discount percentage (currently hardcoded to 10%)
REFERRAL_DISCOUNT_RATE=10

# Affiliate commission rate  
DEFAULT_COMMISSION_RATE=20
```

### Database Schema
The existing affiliate tables support this feature without changes:
- `affiliate_profiles` - stores affiliate info
- `affiliate_commissions` - records earnings on final amounts
- `affiliate_clicks` - tracks referral link usage
- `payment_orders` - stores both affiliate_id and final amounts

## Marketing Advantages

### For Affiliate Promotion:
- **"Get 10% off instantly"** - compelling call-to-action
- **"Plus earn 20% commission"** - attractive for affiliates
- **"Stack with coupon codes"** - maximizes customer value
- **"Transparent tracking"** - builds affiliate confidence

### Sample Affiliate Copy:
*"🎉 Get instant 10% off any course when you use my referral link! Plus, you can still apply coupon codes for even bigger savings. Start learning today!"*

## Future Enhancements

1. **Dynamic referral rates** - Different discounts per affiliate level
2. **Time-limited bonuses** - Special discount periods
3. **Category-specific rates** - Different discounts for different course types
4. **Referral competitions** - Bonus discounts during campaigns

## Monitoring & Analytics

### Key Metrics to Track:
- **Referral conversion rate** (before vs after discount)
- **Average order value** with referral discounts
- **Affiliate satisfaction** with new discount feature
- **Customer retention** from discounted referrals

### Dashboard Insights:
- Track referral discount usage in affiliate dashboard
- Show impact on conversion rates
- Monitor total savings provided to customers
- Analyze commission earnings vs. discount costs

This referral discount system creates a win-win-win scenario: customers get instant savings, affiliates get higher conversions, and the platform increases sales volume through a more attractive affiliate program.