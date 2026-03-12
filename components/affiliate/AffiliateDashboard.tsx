"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Copy,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useUserContext } from "@/app/provider/user-context";
import { toast } from "sonner";

interface AffiliateData {
  profile: {
    id: string;
    referralCode: string;
    commissionRate: number;
    totalSales: number;
    totalEarnings: number;
    isActive: boolean;
    createdAt: string;
  };
  stats: {
    totalCommissions: number;
    pendingCommissions: number;
    approvedCommissions: number;
    paidCommissions: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalClicks: number;
    conversionRate: number;
  };
  commissions: any[];
  links: any[];
  recentClicks: any[];
}

export default function AffiliateDashboard() {
  const { user } = useUserContext();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAffiliateData();
    }
  }, [user]);

  const fetchAffiliateData = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `/api/affiliate/dashboard?userId=${user.id}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch affiliate data");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = (courseId?: string) => {
    const baseUrl = window.location.origin;
    const link = courseId
      ? `${baseUrl}/course/${courseId}?ref=${data?.profile.referralCode}`
      : `${baseUrl}/courses?ref=${data?.profile.referralCode}`;

    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "paid":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Paid
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading affiliate dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error === "Affiliate profile not found"
            ? "You are not registered as an affiliate. Please join the affiliate program first."
            : error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No affiliate data found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals and earnings
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/affiliate/urls")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Generate URLs
          </Button>
          <Badge variant={data.profile.isActive ? "default" : "secondary"}>
            {data.profile.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={data.profile.referralCode}
              readOnly
              className="font-mono text-lg"
            />
            <Button
              variant="outline"
              onClick={() => copyReferralLink()}
              className="shrink-0"
            >
              {copySuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Share this link to earn {data.profile.commissionRate}% commission on
            sales:
          </p>
          <code className="text-sm bg-muted px-2 py-1 rounded block">
            {window.location.origin}/courses?ref={data.profile.referralCode}
          </code>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  ₹{data.stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{data.profile.totalSales}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{data.stats.totalClicks}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {data.stats.conversionRate}%
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                ₹{data.stats.pendingEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.stats.pendingCommissions} commissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-xl font-bold text-blue-600">
                ₹
                {(
                  data.stats.totalEarnings -
                  data.stats.pendingEarnings -
                  data.stats.paidEarnings
                ).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.stats.approvedCommissions} commissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-xl font-bold text-green-600">
                ₹{data.stats.paidEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.stats.paidCommissions} commissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.commissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No commissions yet. Start sharing your referral links!
            </p>
          ) : (
            <div className="space-y-4">
              {data.commissions.slice(0, 10).map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {commission.courses?.title || "Unknown Course"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {commission.users?.full_name ||
                        commission.users?.email ||
                        "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{Math.floor(commission.commission_amount / 100)}
                    </p>
                    {getStatusBadge(commission.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Links */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Links</CardTitle>
        </CardHeader>
        <CardContent>
          {data.links.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No specific course links yet. Links will appear here when people
              click your referrals.
            </p>
          ) : (
            <div className="space-y-4">
              {data.links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {link.courses?.title || "Unknown Course"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{link.courses?.price?.toLocaleString()} •{" "}
                      {link.click_count} clicks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyReferralLink(link.course_id)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
