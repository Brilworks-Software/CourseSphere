# Affiliate URL Generator - Debug Test

## Issues Found and Fixes Applied:

### 1. ✅ Fixed URL Structure
- **Problem**: Generated URLs used `/courses/[id]` but actual route is `/course/[id]`
- **Fix**: Updated `generateAffiliateUrl` function to use correct singular `/course/` path

### 2. ✅ Fixed Course Filtering
- **Problem**: Only showing courses with `status: "published"`, but test data shows `status: "draft"` or `null`
- **Fix**: Updated filter to show active courses (`is_active: true`) for testing purposes

### 3. ✅ Added Better Error Handling
- **Problem**: No clear guidance when affiliate profile missing
- **Fix**: Added refresh button and link to join affiliate program

### 4. ✅ Enhanced Debugging
- **Problem**: Hard to see what data is being fetched
- **Fix**: Added console logging and status badges to show course status

## Current Status:
The affiliate URL generator should now be working! Here's what it does:

1. **Fetches your affiliate profile** from `/api/affiliate/dashboard?userId={userId}`
2. **Gets available courses** from `/api/courses/list?perPage=50`
3. **Filters active courses** (published or active courses)
4. **Generates correct URLs** like `/course/{courseId}?ref={yourReferralCode}`

## Test Steps:

1. **Join affiliate program first** (if not already joined)
   - Go to affiliate signup page
   - Get your referral code

2. **Go to URL generator**
   - Navigate to `/affiliate/urls`
   - Should see your referral code
   - Should see list of available courses

3. **Generate and test links**
   - Click "Copy Link" on any course
   - Paste URL in new tab
   - Should see course page with `?ref=` parameter

## Expected URL Format:
```
https://yourdomain.com/course/7ff1895c-5756-426c-9622-256126021180?ref=ABC12345
```

## Debug Info Available:
- Check browser console for detailed logs
- Course status badges show if course is "Draft" or "Published" 
- Error messages guide you to join affiliate program if needed

The affiliate URL generator should now be fully functional! 🎉