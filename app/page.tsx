import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/landing-header";
import { LandingHero } from "@/components/landing-hero";
import { CategoryMarquee } from "@/components/category-marquee";
import { WhyChooseUs } from "@/components/why-choose-us";
import { WhatHelpsYou } from "@/components/what-helps-you";
import { FeaturedCourses } from "@/components/featured-courses";
import { LandingFooter } from "@/components/landing-footer";

export default async function Home() {
  // Server-side: check Supabase auth. If a user is present, redirect to dashboard.
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      // If authenticated, send them to the dashboard
      redirect("/dashboard");
    }
  } catch (e) {
    // If anything goes wrong with server-side auth check, fall back to showing landing page.
    // Do not throw — we want guests to still see the landing page.
    console.error("Error checking auth on server for / :", e);
  }

  // Unauthenticated: render the landing page
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <LandingHero />
        <CategoryMarquee />
        <WhyChooseUs />
        <WhatHelpsYou />
        <FeaturedCourses />
      </main>
      <LandingFooter />
    </div>
  );
}


