"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { BookOpen, Users, GraduationCap, Building2, Video } from "lucide-react";

const statsConfig = [
  {
    name: "Total Courses",
    key: "coursesCount",
    icon: BookOpen,
    badge: "Courses",
  },
  {
    name: "Total Users",
    key: "usersCount",
    icon: Users,
    badge: "Users",
  },
  {
    name: "Total Enrollments",
    key: "enrollmentsCount",
    icon: GraduationCap,
    badge: "Enrollments",
  },
  {
    name: "Total Organizations",
    key: "organizationsCount",
    icon: Building2,
    badge: "Organizations",
  },
  {
    name: "Total Lessons",
    key: "lessonsCount",
    icon: Video,
    badge: "Lessons",
  },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/super-admin/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Platform-wide analytics and statistics
          </p>
        </div>
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 border border-destructive rounded-md p-4">
          <div className="font-semibold mb-1">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <span className="p-3 rounded-lg border border-muted bg-muted/6">
                    <Icon className="h-6 w-6 text-accent-foreground" />
                  </span>
                  <CardTitle className="text-lg font-semibold">
                    {stat.name}
                  </CardTitle>
                </div>
                <Badge variant="outline">{stat.badge}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loading ? <Loader /> : stats[stat.key] ?? 0}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
