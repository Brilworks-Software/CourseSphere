"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DollarSign, ArrowLeft, Clock, Award, Headphones, Info } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import Link from "next/link";

export default function PricingCalculatorPage() {
  const [courseHours, setCourseHours] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState([5]);
  const [includeSupport, setIncludeSupport] = useState(false);
  const [includeCertificate, setIncludeCertificate] = useState(false);
  const [includeResources, setIncludeResources] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);

  const calculatePrice = () => {
    const hours = parseFloat(courseHours) || 0;
    const basePrice = hours * 20; // $20 per hour base
    const expertiseMultiplier = 1 + (expertiseLevel[0] / 10);
    
    let addOns = 0;
    if (includeSupport) addOns += 50;
    if (includeCertificate) addOns += 30;
    if (includeResources) addOns += 40;

    const price = basePrice * expertiseMultiplier + addOns;
    setSuggestedPrice(Math.max(price, 29)); // Minimum price of $29
  };

  const getExpertiseLabel = (level: number) => {
    if (level >= 9) return "Expert/Authority";
    if (level >= 7) return "Advanced";
    if (level >= 5) return "Intermediate";
    if (level >= 3) return "Beginner-Friendly";
    return "Introduction";
  };

  const getPriceRange = () => {
    if (!suggestedPrice) return null;
    return {
      budget: Math.max(suggestedPrice * 0.6, 29),
      standard: suggestedPrice,
      premium: suggestedPrice * 1.5,
      vip: suggestedPrice * 2
    };
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
                <DollarSign className="h-10 w-10 text-green-500" />
                <Badge variant="secondary" className="text-sm">Free Calculator</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Course Pricing Calculator
              </h1>
              <p className="text-lg text-muted-foreground">
                Get data-driven pricing recommendations for your online course based on content length, 
                your expertise level, and included features. Price your course confidently!
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
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>
                      Provide information about your course to calculate optimal pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="courseHours" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Course Duration (hours)
                      </Label>
                      <Input
                        id="courseHours"
                        type="number"
                        placeholder="e.g., 10"
                        value={courseHours}
                        onChange={(e) => setCourseHours(e.target.value)}
                        step="0.5"
                        min="0.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Total video content length in hours
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Your Expertise Level (1-10)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={expertiseLevel}
                          onValueChange={setExpertiseLevel}
                          max={10}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-32 text-right">
                          {expertiseLevel[0]} - {getExpertiseLabel(expertiseLevel[0])}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your level of expertise and authority in this subject
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label>Additional Features</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <input
                            type="checkbox"
                            id="support"
                            checked={includeSupport}
                            onChange={(e) => setIncludeSupport(e.target.checked)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <Label htmlFor="support" className="cursor-pointer font-medium">
                              <div className="flex items-center gap-2">
                                <Headphones className="h-4 w-4" />
                                1-on-1 Support
                              </div>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Direct access for questions (+$50)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <input
                            type="checkbox"
                            id="certificate"
                            checked={includeCertificate}
                            onChange={(e) => setIncludeCertificate(e.target.checked)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <Label htmlFor="certificate" className="cursor-pointer font-medium">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Certificate of Completion
                              </div>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Official certificate (+$30)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <input
                            type="checkbox"
                            id="resources"
                            checked={includeResources}
                            onChange={(e) => setIncludeResources(e.target.checked)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <Label htmlFor="resources" className="cursor-pointer font-medium">
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Premium Resources
                              </div>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Templates, workbooks, tools (+$40)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={calculatePrice} className="w-full" size="lg">
                      Calculate Optimal Price
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {suggestedPrice !== null ? (
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Pricing Recommendations</CardTitle>
                      <CardDescription>
                        Based on your course details, here are our suggestions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Suggested Price */}
                      <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border-2 border-green-500/20">
                        <p className="text-sm text-muted-foreground mb-2">Suggested Price</p>
                        <p className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">
                          ${suggestedPrice.toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Based on {courseHours || "0"} hours of content
                        </p>
                      </div>

                      {/* Pricing Tiers */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Consider These Pricing Tiers:</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Budget</p>
                            <p className="text-2xl font-bold">${getPriceRange()?.budget.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Early Bird</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Standard</p>
                            <p className="text-2xl font-bold text-primary">${getPriceRange()?.standard.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Regular Price</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">Premium</p>
                            <p className="text-2xl font-bold">${getPriceRange()?.premium.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground mt-1">+ Bonuses</p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground mb-1">VIP</p>
                            <p className="text-2xl font-bold">${getPriceRange()?.vip.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Full Package</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Tips */}
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold text-sm">Pricing Strategy Tips:</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            <span>Offer early bird discount (20-40% off) for first 50 students</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            <span>Create payment plans to increase accessibility</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            <span>Bundle with other courses for higher value packages</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            <span>Test different price points with A/B testing</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          💡 Remember: Price reflects value. Students willing to pay are often more committed 
                          to completing the course and seeing results.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ready to Price?</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Enter your course details on the left to receive pricing recommendations 
                        and strategic guidance for maximum conversions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Factors Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                What Impacts Course Pricing?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <Clock className="h-8 w-8 text-green-500 mb-2" />
                    <CardTitle className="text-lg">Content Length</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Longer courses with more comprehensive content generally command higher prices. 
                    Focus on value, not just length.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Award className="h-8 w-8 text-green-500 mb-2" />
                    <CardTitle className="text-lg">Your Authority</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Recognized experts can charge premium prices. Build your reputation through 
                    testimonials, credentials, and results.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Headphones className="h-8 w-8 text-green-500 mb-2" />
                    <CardTitle className="text-lg">Support Level</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Direct access to you through Q&A, coaching, or community significantly 
                    increases perceived and actual value.
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
