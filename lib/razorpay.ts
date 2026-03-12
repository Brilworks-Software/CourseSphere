import Razorpay from "razorpay";

/**
 * Returns a Razorpay SDK instance.
 * Only call this on the server side.
 *
 * Guards against missing keys — will throw early if RAZORPAY_KEY_ID
 * or RAZORPAY_KEY_SECRET are not set so the error is obvious in logs.
 */
export function getRazorpayInstance(): Razorpay {
  console.log(
    "[getRazorpayInstance] Attempting to access RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
  );

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log(
    "[getRazorpayInstance] RAZORPAY_KEY_ID available:",
    !!keyId ? "✓ Yes" : "✗ Missing",
  );
  console.log(
    "[getRazorpayInstance] RAZORPAY_KEY_SECRET available:",
    !!keySecret ? "✓ Yes" : "✗ Missing",
  );

  if (!keyId || !keySecret) {
    const missingKeys = [];
    if (!keyId) missingKeys.push("RAZORPAY_KEY_ID");
    if (!keySecret) missingKeys.push("RAZORPAY_KEY_SECRET");

    console.error(
      "[getRazorpayInstance] Missing environment variables:",
      missingKeys,
    );

    throw new Error(
      "Razorpay credentials are not configured. " +
        "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment. " +
        "Missing: " +
        missingKeys.join(", "),
    );
  }

  console.log(
    "[getRazorpayInstance] ✓ Successfully creating Razorpay instance",
  );
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Quick helper — returns true when the Razorpay feature flag is enabled.
 * Works on both server and client because it reads NEXT_PUBLIC_*.
 */
export function isRazorpayEnabled(): boolean {
  const enabled = process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true";

  console.log(
    "[isRazorpayEnabled] NEXT_PUBLIC_RAZORPAY_ENABLED value:",
    process.env.NEXT_PUBLIC_RAZORPAY_ENABLED,
  );
  console.log(
    "[isRazorpayEnabled] Razorpay enabled:",
    enabled ? "✓ Yes" : "✗ No",
  );

  return enabled;
}
