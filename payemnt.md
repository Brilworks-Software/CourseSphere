Below is a **clear step-by-step implementation checklist** for adding **Razorpay paid course purchase** into your **Next.js + Supabase + existing schema**.
Follow the order exactly — this is the **same flow used in production systems**. 🚀

---

# Phase 1 — Database Setup

## Step 1 — Add Payment Tables

Create the following tables in Supabase.

### 1️⃣ payment_orders

Tracks Razorpay order creation.

```sql
CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  razorpay_order_id text UNIQUE NOT NULL,
  amount bigint NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'created',
  receipt text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);
```

---

### 2️⃣ payment_transactions

Stores successful payments.

```sql
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  razorpay_payment_id text UNIQUE NOT NULL,
  razorpay_order_id text NOT NULL,
  razorpay_signature text,
  amount bigint NOT NULL,
  currency text DEFAULT 'INR',
  payment_status text DEFAULT 'success',
  paid_at timestamp with time zone DEFAULT timezone('utc', now())
);
```

---

### 3️⃣ course_purchases

Tracks purchase history.

```sql
CREATE TABLE public.course_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  purchase_price bigint NOT NULL,
  purchased_at timestamp with time zone DEFAULT timezone('utc', now())
);
```

---

## Step 2 — Add Indexes

```sql
CREATE INDEX idx_orders_user ON payment_orders(user_id);
CREATE INDEX idx_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_purchases_user ON course_purchases(user_id);
```

---

# Phase 2 — Razorpay Setup

## Step 3 — Install Razorpay SDK

```bash
npm install razorpay
```

---

## Step 4 — Add Environment Variables

`.env.local`

```env
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

NEXT_PUBLIC_RAZORPAY_KEY=your_key
```

---

# Phase 3 — Backend Setup

## Step 5 — Create Razorpay Client

Create file:

```
/lib/razorpay.ts
```

```ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

---

# Phase 4 — Payment Order API

## Step 6 — Create Order API

Create route:

```
/api/payments/create-order
```

Tasks:

1. Get `courseId`
2. Fetch course price
3. Create Razorpay order
4. Store order in DB
5. Return order to frontend

Flow:

```
User clicks Buy
        ↓
Create Razorpay order
        ↓
Save order in payment_orders
        ↓
Return order_id
```

---

# Phase 5 — Frontend Checkout

## Step 7 — Add Razorpay Script

Add to layout:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Step 8 — Create Buy Course Button

When clicked:

1️⃣ Call `/create-order`
2️⃣ Receive order data
3️⃣ Open Razorpay checkout

Flow:

```
Click Buy Course
       ↓
Call create-order API
       ↓
Receive order_id
       ↓
Open Razorpay Checkout
```

---

# Phase 6 — Payment Verification

## Step 9 — Create Verify Payment API

Create route:

```
/api/payments/verify
```

Tasks:

1️⃣ Receive

```
razorpay_payment_id
razorpay_order_id
razorpay_signature
```

2️⃣ Verify signature using crypto

3️⃣ Fetch order from DB

4️⃣ Insert transaction

5️⃣ Create purchase

6️⃣ Create enrollment

7️⃣ Update order status

---

# Phase 7 — Enrollment Creation

## Step 10 — Grant Course Access

Insert:

```sql
INSERT INTO enrollments (student_id, course_id)
VALUES (user_id, course_id);
```

After payment success.

---

# Phase 8 — Webhook (IMPORTANT)

## Step 11 — Create Webhook Endpoint

Route:

```
/api/webhooks/razorpay
```

Purpose:

If frontend fails, webhook still records payment.

Events to handle:

```
payment.captured
payment.failed
refund.processed
```

---

## Step 12 — Configure Webhook in Razorpay Dashboard

Go to:

```
Razorpay Dashboard
Settings
Webhooks
```

Add:

```
https://yourdomain.com/api/webhooks/razorpay
```

Add secret:

```
RAZORPAY_WEBHOOK_SECRET
```

---

# Phase 9 — Access Control

## Step 13 — Lock Course Content

When user opens course page:

Check enrollment.

```sql
SELECT *
FROM enrollments
WHERE student_id = user_id
AND course_id = course_id
```

If exists → show course
Else → show **Buy Course button**

---

# Phase 10 — UI Updates

## Step 14 — Course Page Changes

Add:

```
If course.is_free → Enroll button
If course.is_paid → Buy button
```

---

# Phase 11 — Testing

## Step 15 — Use Razorpay Test Mode

Test cards:

```
4111 1111 1111 1111
Expiry: any future date
CVV: 123
```

Test scenarios:

✔ payment success
✔ payment failure
✔ webhook trigger

---

# Phase 12 — Production Safety

## Step 16 — Security Rules

Always:

✔ verify payment signature
✔ never trust frontend success
✔ use webhook backup
✔ check duplicate purchases
✔ prevent double enrollment

---

# Final Payment Flow

```
User clicks Buy Course
        ↓
Create Razorpay Order
        ↓
Open Checkout
        ↓
Payment Success
        ↓
Verify Payment API
        ↓
Store Transaction
        ↓
Create Purchase
        ↓
Create Enrollment
        ↓
User Access Course
```

---

💡 **Pro tip for your schema:**
Add **unique constraint** to avoid duplicate purchases.

```sql
ALTER TABLE enrollments
ADD CONSTRAINT unique_course_enrollment
UNIQUE (student_id, course_id);
```

