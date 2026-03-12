# Affiliate System Documentation

## Overview

The affiliate system allows users to earn commissions by referring others to purchase courses. This document explains how the affiliate system works, the technical implementation, and the user flow.

## What is an Affiliate System?

An affiliate system is a marketing arrangement where an affiliate earns commission for each customer brought by the affiliate's marketing efforts. In our platform:

1. **Affiliates** are users who sign up to promote courses
2. **Referral codes** are unique identifiers assigned to each affiliate
3. **Commissions** are earned when someone purchases through an affiliate link
4. **Tracking** monitors clicks and conversions for 30 days

## How It Works

### 1. User Flow for Becoming an Affiliate

```
User wants to become affiliate
    ↓
Signs up through AffiliateSignup component
    ↓ 
System generates unique referral code (8 characters)
    ↓
User gets access to affiliate dashboard
    ↓
User can generate referral links and track performance
```

### 2. Customer Flow with Affiliate Links

```
Customer clicks affiliate link: /course/abc123?ref=XYZ789
    ↓
AffiliateTracker component captures referral code
    ↓
Stores referral code in localStorage (30 days)
    ↓
Tracks click in database
    ↓
When customer purchases, affiliate gets credit
    ↓
Commission is recorded and affiliate earns money
```

### 3. Commission Structure

- **Commission Rate**: 20% of final purchase amount (after discounts)
- **Tracking Period**: 30 days from first click
- **Status Flow**: Pending → Approved → Paid
- **Payment**: Affiliates can request withdrawals once approved

## Technical Implementation

### Database Schema

The affiliate system uses several tables:

1. **`affiliate_profiles`** - Store affiliate information
2. **`affiliate_links`** - Track affiliate links for specific courses
3. **`affiliate_clicks`** - Record every click on affiliate links
4. **`affiliate_commissions`** - Store commission records
5. **`affiliate_withdrawals`** - Handle payout requests

### API Endpoints

#### `/api/affiliate/create` (POST)
Creates a new affiliate profile with unique referral code.

**Request:**
```json
{
  "userId": "user_uuid"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "affiliate_uuid",
    "referralCode": "ABC12345",
    "commissionRate": 20
  }
}
```

#### `/api/affiliate/validate` (POST)
Validates affiliate referral codes and optionally tracks clicks.

**Request:**
```json
{
  "referralCode": "ABC12345",
  "courseId": "course_uuid",
  "clickData": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### `/api/affiliate/dashboard` (GET)
Retrieves affiliate stats, commissions, and performance data.

**Query Params:**
- `userId`: User UUID

**Response:**
```json
{
  "profile": { ... },
  "stats": {
    "totalCommissions": 15,
    "pendingCommissions": 5,
    "totalEarnings": 25000,
    "totalClicks": 150,
    "conversionRate": 10
  },
  "commissions": [...],
  "links": [...],
  "recentClicks": [...]
}
```

#### `/api/affiliate/track-click` (POST)
Records affiliate link clicks for analytics.

### Frontend Components

#### `AffiliateTracker`
- Captures referral codes from URL parameters
- Stores codes in localStorage with expiration
- Tracks clicks when on course pages

#### `AffiliateSignup`
- Allows users to join the affiliate program
- Shows commission rates and benefits
- Generates unique referral codes

#### `AffiliateDashboard`
- Shows affiliate performance stats
- Lists commissions and earnings
- Provides referral link generation
- Displays click analytics

### Integration Points

#### Payment Flow Integration
When a customer purchases a course:

1. **Order Creation** (`/api/payments/create-order`)
   - Checks for stored affiliate code
   - Associates affiliate with the order
   - Calculates commission amount

2. **Payment Verification** (`/api/payments/verify`)
   - Records commission in `affiliate_commissions` table
   - Updates affiliate's total sales and earnings
   - Sets commission status to "pending"

#### Course Page Integration
- Include `<AffiliateTracker />` component on course pages
- Automatically captures and stores referral codes
- Tracks clicks for performance analytics

## Configuration

### Environment Variables
```bash
# Default commission rate (percentage)
DEFAULT_COMMISSION_RATE=20

# Affiliate tracking cookie duration (days)
AFFILIATE_TRACKING_DAYS=30
```

### Customization Options

1. **Commission Rates**: Can be set per affiliate in the database
2. **Tracking Duration**: Configurable via code (currently 30 days)
3. **Referral Code Length**: Configurable in affiliate creation API
4. **Minimum Payout**: Can be added to withdrawal system

## Example Usage

### Creating Referral Links

For course-specific links:
```
https://yoursite.com/course/[course-id]?ref=ABC12345
```

For general browse links:
```
https://yoursite.com/courses?ref=ABC12345
```

### Checking Affiliate Performance

```javascript
// Get affiliate dashboard data
const response = await fetch(`/api/affiliate/dashboard?userId=${userId}`);
const data = await response.json();

console.log(`Total Earnings: ₹${data.stats.totalEarnings}`);
console.log(`Conversion Rate: ${data.stats.conversionRate}%`);
```

## Best Practices

### For Affiliates
1. Share referral links on relevant platforms
2. Create valuable content around courses
3. Engage with your audience authentically
4. Monitor your dashboard for performance insights

### For Platform Administrators
1. Monitor commission rates and adjust as needed
2. Review and approve commissions regularly
3. Provide marketing materials to affiliates
4. Track affiliate performance and provide support

## Troubleshooting

### Common Issues

1. **Affiliate code not tracking**: Check if AffiliateTracker is included on the page
2. **Commission not recording**: Verify payment flow includes affiliate logic
3. **Referral links not working**: Ensure affiliate profile is active
4. **Dashboard not loading**: Check API permissions and error logs

### Debug Steps

1. Check browser localStorage for stored affiliate codes
2. Verify database records in affiliate tables
3. Monitor API responses in network tab
4. Check server logs for affiliate-related errors

## Future Enhancements

1. **Multi-tier Commissions**: Allow affiliates to earn from sub-affiliates
2. **Dynamic Commission Rates**: Course-specific or performance-based rates
3. **Advanced Analytics**: More detailed reporting and insights
4. **Automated Payouts**: Integration with payment systems
5. **Marketing Tools**: Banners, email templates, social media assets

## Security Considerations

1. **Fraud Prevention**: Monitor for click fraud and unusual patterns
2. **Rate Limiting**: Prevent abuse of API endpoints
3. **Data Protection**: Secure storage of affiliate and customer data
4. **Validation**: Always validate referral codes server-side

## Support and Resources

For questions or issues with the affiliate system:

1. Check this documentation first
2. Review API error responses
3. Consult database schema documentation
4. Contact technical support team

---

This affiliate system provides a robust foundation for partner marketing while maintaining security and performance standards.