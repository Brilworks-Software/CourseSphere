# Single Discount Code Policy Implementation

## Overview
Implemented a policy where only **one discount code can be applied at a time** - either a referral discount (10% automatic) OR a coupon code, but not both simultaneously.

## How It Works

### Scenario 1: Referral Discount Applied First
1. **User visits via affiliate link** (`/course/123?ref=ABC12345`)
2. **10% referral discount automatically applied**
3. **Coupon input section shows message**: "Coupon codes cannot be used with referral discounts. Only one discount code can be applied at a time."
4. **Coupon input is disabled** with amber warning box
5. **If user tries to apply coupon via API**, error message shown

### Scenario 2: Coupon Applied First  
1. **User visits course page normally**
2. **Enters and applies coupon code**
3. **Referral discount check is skipped** (even if they have affiliate code)
4. **Only coupon discount applies**

### Scenario 3: Removing Applied Discount
1. **User removes applied coupon** (clicks X button)
2. **System checks for stored referral code**
3. **If referral code exists**, automatically applies 10% referral discount
4. **Seamless transition** between discount types

## Technical Implementation

### Frontend Changes (EnrollButton.tsx):
```typescript
// 1. Conditional rendering - show warning when referral discount active
{appliedCoupon ? (
  // Show applied coupon
) : referralDiscount ? (
  // Show "only one discount" message
) : (
  // Show coupon input
)}

// 2. Validation in coupon application
const handleApplyCoupon = async () => {
  if (referralDiscount) {
    setError("Cannot apply coupon code when referral discount is active...");
    return;
  }
  // ... proceed with coupon validation
};

// 3. Re-check referral discount when coupon removed
const removeCoupon = () => {
  // ... remove coupon
  // Check if referral discount should be applied
  if (affiliateCode && !referralDiscount) {
    checkReferralDiscount();
  }
};
```

### Backend Logic (Unchanged):
- Payment order creation still handles both discount types
- Commission calculation remains fair (20% on final amount paid)
- Referral discount applied first, then coupon (if no referral)

## User Experience

### Visual Indicators:
- **🎉 Referral Discount**: Blue banner showing 10% off with affiliate code
- **✅ Coupon Applied**: Green banner showing coupon code and discount amount  
- **⚠️ Cannot Mix**: Amber warning when trying to use both types

### Messages Shown:
- **Primary**: "Coupon codes cannot be used with referral discounts"
- **Secondary**: "Only one discount code can be applied at a time"
- **Error**: "Cannot apply coupon code when referral discount is active..."

## Benefits

### For Platform:
- **Prevents discount stacking abuse**
- **Clearer pricing structure**
- **Simplified commission calculations**
- **Better cost control**

### For Users:
- **Clear discount rules**
- **No confusion about pricing**
- **Automatic application of best available discount**
- **Fair and transparent system**

### For Affiliates:
- **Protected referral discounts**
- **Fair commission on actual payments**
- **Competitive 10% instant discount for customers**

## Example Flows

### Flow A: Referral Link → Blocked Coupon
```
User clicks: /course/123?ref=XYZ789
→ 10% referral discount applied automatically
→ Price: ₹5000 → ₹4500 (saves ₹500)
→ Coupon section shows warning message
→ User proceeds with referral discount
```

### Flow B: Coupon First → No Referral Discount  
```
User visits: /course/123 directly
→ Enters coupon "SAVE20" (20% off)
→ Price: ₹5000 → ₹4000 (saves ₹1000)  
→ Referral discount check skipped
→ User gets better coupon discount
```

### Flow C: Switch Discount Types
```
User has coupon applied → Clicks X to remove
→ System checks for stored referral code
→ Finds ref=XYZ789 in localStorage
→ Automatically applies 10% referral discount
→ Seamless transition to referral discount
```

This implementation ensures **fair discount policies**, **prevents abuse**, and provides **clear user experience** while maintaining the affiliate program benefits! 🎉