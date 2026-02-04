"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  TrendingUp, 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

export default function RevenueProjectionPage() {
  const [expectedReach, setExpectedReach] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [conversionRate, setConversionRate] = useState([2]);
  const [projection, setProjection] = useState<any>(null);

  const calculateProjection = () => {
    const reach = parseInt(expectedReach) || 0;
    const price = parseFloat(coursePrice) || 0;
    const conversion = conversionRate[0] / 100;

    const enrollments = Math.floor(reach * conversion);
    const grossRevenue = enrollments * price;
    
    // Estimate platform fees (assume 10% average)
    const platformFees = grossRevenue * 0.10;
    const netRevenue = grossRevenue - platformFees;
    
    const monthlyRevenue = grossRevenue / 12;
    const monthlyNet = netRevenue / 12;

    setProjection({
      enrollments,
      grossRevenue,
      netRevenue,
      platformFees,
      monthlyRevenue,
      monthlyNet,
      conversionRate: conversion * 100
    });
  };

  const getConversionLabel = (rate: number) => {
    if (rate >= 5) return "Optimistic";
    if (rate >= 3) return "Good";
    if (rate >= 2) return "Average";
    if (rate >= 1) return "Conservative";
    return "Very Conservative";
  };

  const getRevenueInsights = () => {
    if (!projection) return [];
    
    const insights = [];
    
    if (projection.enrollments < 10) {
      insights.push({
        type: "warning",
        message: "Low enrollment projection. Consider growing your audience or improving conversion strategies."
      });
    } else if (projection.enrollments >= 100) {
      insights.push({
        type: "success",
        message: "Strong enrollment potential! Plan for scalable course delivery."
      });
    }
    
    if (projection.monthlyNet >= 5000) {
      insights.push({
        type: "success",
        message: "Excellent monthly revenue potential. This could become a significant income stream."
      });
    }
    
    if (conversionRate[0] >= 5) {
      insights.push({
        type: "info",
        message: "Your conversion rate is optimistic. Industry average is 2-3%. Build trust first."
      });
    }
    
    return insights;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <Link 
              href="/tools" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-10 w-10 text-purple-500" />
                <Badge variant="secondary" className="text-sm">Free Projection Tool</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Course Revenue Projection Tool
              </h1>
              <p className="text-lg text-muted-foreground">
                Estimate your potential course revenue based on audience reach, pricing strategy, 
                and realistic conversion rates. Plan your course launch with confidence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Input Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Your Projections</CardTitle>
                    <CardDescription>
                      Enter your expected metrics to calculate revenue projections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="expectedReach" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Expected Reach (people)
                      </Label>
                      <Input
                        id="expectedReach"
                        type="number"
                        placeholder="e.g., 5000"
                        value={expectedReach}
                        onChange={(e) => setExpectedReach(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        How many people will see your course offer (email list, followers, audience)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coursePrice" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Course Price ($)
                      </Label>
                      <Input
                        id="coursePrice"
                        type="number"
                        placeholder="e.g., 99"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        The price you plan to charge for your course
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Expected Conversion Rate (%)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={conversionRate}
                          onValueChange={setConversionRate}
                          max={10}
                          min={0.5}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-32 text-right">
                          {conversionRate[0]}% - {getConversionLabel(conversionRate[0])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Percentage of people who will purchase (industry average: 2-3%)
                      </p>
                    </div>

                    <Button onClick={calculateProjection} className="w-full" size="lg">
                      Calculate Revenue Projection
                    </Button>

                    {/* Quick Stats */}
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm mb-3">Your Input Summary:</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{expectedReach || "0"}</p>
                          <p className="text-xs text-muted-foreground">Reach</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">${coursePrice || "0"}</p>
                          <p className="text-xs text-muted-foreground">Price</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{conversionRate[0]}%</p>
                          <p className="text-xs text-muted-foreground">Conv. Rate</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {projection ? (
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Revenue Projection</CardTitle>
                      <CardDescription>
                        Based on your inputs, here's your estimated revenue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Revenue */}
                      <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg border-2 border-purple-500/20">
                        <p className="text-sm text-muted-foreground mb-2">Estimated Gross Revenue</p>
                        <p className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          ${projection.grossRevenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          from {projection.enrollments} enrollments
                        </p>
                      </div>

                      {/* Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Net Revenue</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${projection.netRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">After platform fees</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Platform Fees</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            ${projection.platformFees.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Est. 10% average</p>
                        </div>
                      </div>

                      {/* Monthly Breakdown */}
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Monthly Breakdown</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Gross/Month</p>
                            <p className="text-xl font-bold">
                              ${projection.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Net/Month</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              ${projection.monthlyNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Insights */}
                      {getRevenueInsights().length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Insights:</h4>
                          {getRevenueInsights().map((insight, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg text-sm ${
                                insight.type === "success"
                                  ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                                  : insight.type === "warning"
                                  ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                  : "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {insight.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Items */}
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold text-sm">To Reach This Goal:</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span>Build an email list of at least {expectedReach || "X"} subscribers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span>Optimize your sales page for {conversionRate[0]}% conversion</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span>Create a compelling launch campaign</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span>Leverage testimonials and social proof</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ready to Project?</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Enter your expected reach, pricing, and conversion rate on the left 
                        to see your potential revenue projections.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Maximize Your Revenue Potential
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <Users className="h-8 w-8 text-purple-500 mb-2" />
                    <CardTitle className="text-lg">Grow Your Audience</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The larger your engaged audience, the more potential customers you have. 
                    Focus on value-driven content to grow organically.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Target className="h-8 w-8 text-purple-500 mb-2" />
                    <CardTitle className="text-lg">Improve Conversion</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Small improvements in conversion rate dramatically impact revenue. 
                    Test your sales page, pricing, and messaging.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <DollarSign className="h-8 w-8 text-purple-500 mb-2" />
                    <CardTitle className="text-lg">Value-Based Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price based on the transformation you provide, not just course hours. 
                    Don't undervalue your expertise.
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
