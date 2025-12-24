"use client";

import SignupForm from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-svh bg-background">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
