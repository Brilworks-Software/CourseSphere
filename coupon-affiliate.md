Since **your Razorpay setup is already done** and **all DB tables are ready**, now the remaining work is mainly **backend logic + checkout flow integration**.
Below is a **clear step-by-step implementation plan** for **Coupon + Affiliate Tracking together** in a **Next.js + Supabase + Razorpay** stack.

---

# 1️⃣ Define the Checkout Flow (Important)

Before coding, decide the flow.

**User Flow**

1. User opens pricing page
2. User enters **coupon code OR affiliate link already applied**
3. System **validates coupon**
4. Price recalculated
5. Razorpay order created with **discounted price**
6. Payment success
7. Webhook verifies payment
8. System

   * marks order **paid**
   * stores **coupon usage**
   * assigns **affiliate commission**

---

# 2️⃣ Create Coupon Validation API

Create API

```
/api/coupons/validate
```

### Request

```json
{
  "coupon": "WELCOME50",
  "planId": "pro"
}
```

### Logic

1. Find coupon in DB
2. Check active
3. Check expiry
4. Check usage limit
5. Check plan applicability
6. Calculate discount

### Example Response

```json
{
  "valid": true,
  "discountType": "percentage",
  "discountValue": 20,
  "finalPrice": 799
}
```

---

# 3️⃣ Coupon Validation Logic

Pseudo logic

```
SELECT * FROM coupons WHERE code = ?
```

Then validate

```
if (!coupon.active) reject
if (now > coupon.expires_at) reject
if (usage_count >= max_usage) reject
```

Calculate discount

```
if percentage:
    discount = price * percentage / 100

if flat:
    discount = amount
```

Return

```
final_price = price - discount
```

---

# 4️⃣ Affiliate Tracking (Link Based)

Affiliate link example

```
https://yoursite.com/pricing?ref=abc123
```

### Step

On page load

```
const ref = searchParams.get("ref")
```

Store in

```
localStorage
or
cookie
```

Example

```
localStorage.setItem("affiliate_ref", ref)
```

This allows tracking even if user signs up later.

---

# 5️⃣ Attach Affiliate During Checkout

During checkout call:

```
/api/payment/create-order
```

Send

```
{
  planId: "pro",
  coupon: "WELCOME50",
  affiliate: "abc123"
}
```

---

# 6️⃣ Create Razorpay Order

Inside API

```
const order = await razorpay.orders.create({
  amount: finalPrice * 100,
  currency: "INR",
  receipt: orderId
})
```

Save order in DB

```
orders
```

Fields

```
id
user_id
plan_id
original_price
discount_amount
final_price
coupon_id
affiliate_id
status = pending
razorpay_order_id
```

---

# 7️⃣ Payment Success Handling

Razorpay frontend success callback

```
handler: async function (response) {

await fetch("/api/payment/verify", {
  method: "POST",
  body: JSON.stringify(response)
})
}
```

---

# 8️⃣ Verify Payment API

Endpoint

```
/api/payment/verify
```

Steps

1️⃣ Verify Razorpay signature

```
crypto.createHmac("sha256", secret)
```

2️⃣ Update order

```
status = paid
```

3️⃣ Save payment

---

# 9️⃣ Record Coupon Usage

Insert

```
coupon_usage
```

Fields

```
coupon_id
user_id
order_id
used_at
```

Also update

```
coupons.usage_count += 1
```

---

# 🔟 Record Affiliate Commission

Insert

```
affiliate_conversions
```

Example

```
{
 affiliate_id: 12,
 order_id: "order_123",
 user_id: "user_1",
 commission_amount: 200,
 status: "pending"
}
```

Commission logic

Example

```
commission = finalPrice * affiliate.commission_rate / 100
```

---

# 1️⃣1️⃣ Affiliate Dashboard Query

Affiliate sees

```
SELECT
orders.id,
orders.final_price,
affiliate_conversions.commission_amount
FROM affiliate_conversions
JOIN orders
```

---

# 1️⃣2️⃣ Coupon Admin Dashboard

Admin should be able to

Create coupon

```
code
discount_type
discount_value
max_usage
expiry_date
applicable_plan
```

---

# 1️⃣3️⃣ Security Checks (Important)

Always validate coupon **server-side**.

Never trust frontend price.

Always calculate price again in API.

---

# 1️⃣4️⃣ Suggested Folder Structure

```
/app/api
    /coupons
        validate/route.ts

    /payment
        create-order/route.ts
        verify/route.ts

/lib
    razorpay.ts
    coupon.ts
    affiliate.ts
```

---

# 1️⃣5️⃣ Extra Features (Highly Recommended)

Add these later

### Coupon Features

• first-time-user coupon
• per-user usage limit
• plan-specific coupon
• automatic coupon

---

### Affiliate Features

• recurring commission
• payout dashboard
• referral analytics

---

# 🔥 Example Real Flow

User visits

```
/pricing?ref=nayan123
```

System stores affiliate

User enters

```
STARTUP50
```

Coupon applied

```
₹999 → ₹499
```

Payment success

System records

```
order
coupon usage
affiliate commission
```

---
