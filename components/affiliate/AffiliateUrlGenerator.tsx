"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, ExternalLink, Search, Loader2 } from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  price: number;
  thumbnail_url?: string;
  instructor_id: string;
  is_free: boolean;
  is_active: boolean;
  status: string;
}

interface AffiliateProfile {
  referralCode: string;
}

export default function AffiliateUrlGenerator() {
  const { user } = useUserContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [affiliateProfile, setAffiliateProfile] =
    useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Filter courses based on search term
    if (searchTerm.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch affiliate profile
      const profileResponse = await fetch(
        `/api/affiliate/dashboard?userId=${user.id}`,
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setAffiliateProfile({
          referralCode: profileData.profile.referralCode,
        });
        console.log(
          "Affiliate profile loaded:",
          profileData.profile.referralCode,
        );
      } else {
        console.error(
          "Failed to fetch affiliate profile:",
          await profileResponse.text(),
        );
        toast.error("Failed to load affiliate profile");
        return;
      }

      // Fetch available courses
      const coursesResponse = await fetch("/api/courses/list?perPage=50");
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        console.log("Raw courses data:", coursesData);

        // Extract courses from the response and filter active courses
        const availableCourses = (
          coursesData.courses ||
          coursesData ||
          []
        ).filter(
          (course: Course) =>
            // Show published courses, and also draft courses for testing (when no published courses exist)
            course.status === "published" || course.is_active === true,
        );

        console.log("Available courses found:", availableCourses.length);
        setCourses(availableCourses);
        setFilteredCourses(availableCourses);
      } else {
        console.error("Failed to fetch courses:", await coursesResponse.text());
        toast.error("Failed to load courses");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateUrl = (courseId: string) => {
    if (!affiliateProfile?.referralCode) return "";

    const baseUrl = window.location.origin;
    return `${baseUrl}/courses/${courseId}?ref=${affiliateProfile.referralCode}`;
  };

  const copyUrl = async (courseId: string) => {
    const url = generateAffiliateUrl(courseId);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrls((prev) => new Set([...prev, courseId]));
      toast.success("Affiliate link copied to clipboard!");

      // Reset copied status after 2 seconds
      setTimeout(() => {
        setCopiedUrls((prev) => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const previewUrl = (courseId: string) => {
    const url = generateAffiliateUrl(courseId);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading courses...</span>
      </div>
    );
  }

  if (!affiliateProfile) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Please join the affiliate program first to generate referral links.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button asChild>
            <a href="/affiliate">Join Affiliate Program</a>
          </Button>
          <Button variant="outline" onClick={() => fetchData()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Affiliate URL Generator</h2>
        <p className="text-muted-foreground">
          Generate shareable affiliate links for any course
        </p>
      </div>

      {/* Referral Code Display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Your Referral Code:
              </p>
              <p className="font-mono font-bold text-lg">
                {affiliateProfile.referralCode}
              </p>
            </div>
            <Badge variant="default">20% Commission</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm
              ? "No courses found matching your search."
              : "No active courses available. Please contact admin to publish courses."}
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Course Thumbnail */}
                  {course.thumbnail_url && (
                    <div className="shrink-0">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={course.is_free ? "secondary" : "default"}>
                        {course.is_free
                          ? "Free"
                          : `₹${course.price.toLocaleString()}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.status || "Draft"}
                      </Badge>
                      {!course.is_free && (
                        <Badge variant="outline" className="text-green-600">
                          Earn ₹
                          {Math.round(course.price * 0.2).toLocaleString()}
                        </Badge>
                      )}
                    </div>

                    {/* Generated URL Preview */}
                    <div className="bg-muted p-2 rounded text-sm font-mono break-all mb-3">
                      {generateAffiliateUrl(course.id)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => copyUrl(course.id)}
                      className="min-w-25"
                    >
                      {copiedUrls.has(course.id) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewUrl(course.id)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Affiliate Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-sm">
              Copy the affiliate link for any course you want to promote
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="text-sm">
              Share the link on social media, blogs, emails, or anywhere your
              audience can see it
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="text-sm">
              Earn 20% commission when someone purchases through your link
              (tracked for 30 days)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
