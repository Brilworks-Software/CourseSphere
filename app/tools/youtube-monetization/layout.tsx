import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Course Monetization Readiness Calculator | CourseSphere",
  description: "Free tool to analyze your YouTube channel's readiness for course monetization. Get data-driven insights on audience strength, engagement rate, and earning potential. Discover your ideal course pricing strategy.",
  keywords: [
    "YouTube monetization calculator",
    "course monetization readiness",
    "YouTube to course conversion",
    "audience readiness assessment",
    "course pricing calculator",
    "YouTube engagement analysis",
    "creator monetization tool",
    "online course pricing",
    "YouTube creator tools",
    "course selling readiness",
    "content creator monetization",
    "YouTube analytics tool"
  ],
  authors: [{ name: "CourseSphere" }],
  creator: "CourseSphere",
  publisher: "CourseSphere",
  openGraph: {
    title: "YouTube Course Monetization Readiness Calculator",
    description: "Analyze your YouTube channel and discover if you're ready to sell courses. Get personalized insights on your monetization potential and recommended course pricing.",
    url: "https://coursesphere.com/tools/youtube-monetization",
    siteName: "CourseSphere",
    images: [
      {
        url: "/og-youtube-tool.png",
        width: 1200,
        height: 630,
        alt: "YouTube Course Monetization Calculator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Course Monetization Readiness Calculator",
    description: "Analyze your YouTube channel and discover if you're ready to sell courses. Free tool by CourseSphere.",
    images: ["/og-youtube-tool.png"],
    creator: "@coursesphere",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://coursesphere.com/tools/youtube-monetization",
  },
};

export default function YouTubeMonetizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
