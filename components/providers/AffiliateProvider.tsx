"use client";

import { Suspense } from "react";
import AffiliateTracker from "@/components/affiliate/AffiliateTracker";

export function AffiliateProvider() {
  return (
    <Suspense fallback={null}>
      <AffiliateTracker />
    </Suspense>
  );
}
