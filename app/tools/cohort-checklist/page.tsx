"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LandingHeader } from '@/components/landing-header';
import { LandingFooter } from '@/components/landing-footer';
import { CheckSquare, ArrowLeft, AlertTriangle, CheckCircle2, Clock, DollarSign, MessageSquare, Video, FileText } from 'lucide-react';
import Loader from '@/components/loader';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  task: string;
  priority: 'critical' | 'important' | 'recommended';
  completed: boolean;
  riskWarning?: string;
}

interface ChecklistCategory {
  category: string;
  icon: string;
  items: ChecklistItem[];
}

interface ChecklistResult {
  cohortSize: number;
  duration: string;
  tools: string[];
  checklist: ChecklistCategory[];
  riskWarnings: string[];
  priorityInsights: string;
  readinessScore: number;
}

// Icon mapping
const iconMap: Record<string, any> = {
  FileText,
  DollarSign,
  MessageSquare,
  Video,
  Clock,
};

interface ChecklistResult {
  cohortSize: number;
  duration: string;
  tools: string[];
  checklist: ChecklistCategory[];
  riskWarnings: string[];
  priorityInsights: string;
  readinessScore: number;
}

export default function CohortChecklistPage() {
  const [cohortSize, setCohortSize] = useState('');
  const [duration, setDuration] = useState<'2-weeks' | '4-weeks' | '8-weeks' | '12-weeks'>('4-weeks');
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChecklistResult | null>(null);
  const [error, setError] = useState('');

  const availableTools = [
    'Zoom',
    'Google Meet',
    'Discord',
    'Slack',
    'Stripe',
    'PayPal',
    'Gumroad',
    'ConvertKit',
    'Mailchimp',
    'Notion',
    'Google Drive',
    'Loom',
    'Canva',
  ];

  const handleToolToggle = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/tools/cohort-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortSize: parseInt(cohortSize),
          duration,
          tools,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate checklist');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = (categoryIndex: number, itemId: string) => {
    if (!result) return;

    const updatedChecklist = [...result.checklist];
    const item = updatedChecklist[categoryIndex].items.find((i) => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      setResult({ ...result, checklist: updatedChecklist });
    }
  };

  const getCompletionStats = () => {
    if (!result) return { completed: 0, total: 0, percentage: 0 };
    
    let completed = 0;
    let total = 0;
    
    result.checklist.forEach((category) => {
      category.items.forEach((item) => {
        total++;
        if (item.completed) completed++;
      });
    });
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const isFormValid = () => {
    return cohortSize && parseInt(cohortSize) > 0 && tools.length > 0;
  };

  const stats = result ? getCompletionStats() : null;

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back Button */}
          <Link href="/tools">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <CheckSquare className="h-4 w-4" />
              First Cohort Launch Checklist
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Never Forget Critical Launch Steps
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get a complete checklist for your first cohort launch. Reduce anxiety, stay organized, and launch with confidence.
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Setup Your Cohort Checklist</CardTitle>
                <CardDescription>
                  Tell us about your cohort and the tools you are using
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cohort Size */}
                    <div className="space-y-2">
                      <Label htmlFor="cohortSize">Cohort Size</Label>
                      <Input
                        id="cohortSize"
                        type="number"
                        placeholder="e.g., 20"
                        value={cohortSize}
                        onChange={(e) => setCohortSize(e.target.value)}
                        min="1"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        How many students in this cohort?
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="duration">Cohort Duration</Label>
                      <Select value={duration} onValueChange={(v: any) => setDuration(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2-weeks">2 Weeks</SelectItem>
                          <SelectItem value="4-weeks">4 Weeks</SelectItem>
                          <SelectItem value="8-weeks">8 Weeks</SelectItem>
                          <SelectItem value="12-weeks">12 Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tools Selection */}
                  <div className="space-y-2">
                    <Label>Tools You Are Using</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableTools.map((tool) => (
                        <div
                          key={tool}
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                            tools.includes(tool)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            id={tool}
                            checked={tools.includes(tool)}
                            onCheckedChange={() => handleToolToggle(tool)}
                          />
                          <Label
                            htmlFor={tool}
                            className="cursor-pointer text-sm flex-1"
                            onClick={() => handleToolToggle(tool)}
                          >
                            {tool}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select all that apply (minimum 1 required)
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !isFormValid()}>
                    {loading ? 'Creating Your Checklist...' : 'Generate Launch Checklist'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <Loader />
            </motion.div>
          )}

          {/* Results */}
          {result && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Readiness Score */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Your Launch Readiness</CardTitle>
                      <CardDescription>
                        Track your progress as you prepare
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-primary">{stats.percentage}%</div>
                      <p className="text-sm text-muted-foreground">
                        {stats.completed} of {stats.total} complete
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-600 to-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Risk Warnings */}
              {result.riskWarnings.length > 0 && (
                <Card className="border-2 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                      <AlertTriangle className="h-5 w-5" />
                      Critical Reminders
                    </CardTitle>
                    <CardDescription className="text-orange-800 dark:text-orange-200">
                      Most creators forget these things
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.riskWarnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2 text-orange-900 dark:text-orange-100">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Priority Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Priority Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{result.priorityInsights}</p>
                </CardContent>
              </Card>

              {/* Checklist Categories */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Your Launch Checklist</h2>

                {result.checklist.map((category, categoryIndex) => {
                  const IconComponent = iconMap[category.icon] || FileText;
                  const categoryCompleted = category.items.filter((i) => i.completed).length;
                  const categoryTotal = category.items.length;

                  return (
                    <motion.div
                      key={categoryIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              {category.category}
                            </CardTitle>
                            <Badge variant={categoryCompleted === categoryTotal ? 'default' : 'secondary'}>
                              {categoryCompleted}/{categoryTotal}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {category.items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                                item.completed
                                  ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20'
                                  : 'border-border'
                              }`}
                            >
                              <Checkbox
                                id={item.id}
                                checked={item.completed}
                                onCheckedChange={() => toggleChecklistItem(categoryIndex, item.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={item.id}
                                  className={`cursor-pointer ${
                                    item.completed ? 'line-through text-muted-foreground' : ''
                                  }`}
                                >
                                  {item.task}
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.priority === 'critical'
                                        ? 'border-red-500 text-red-700 dark:text-red-300'
                                        : item.priority === 'important'
                                        ? 'border-orange-500 text-orange-700 dark:text-orange-300'
                                        : 'border-blue-500 text-blue-700 dark:text-blue-300'
                                    }
                                  >
                                    {item.priority}
                                  </Badge>
                                  {item.riskWarning && (
                                    <span className="text-xs text-orange-600 dark:text-orange-400">
                                      ⚠️ {item.riskWarning}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="text-2xl font-bold">You Are Ready to Launch</h3>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Follow this checklist and you will avoid the common mistakes that derail first cohorts. Take it one step at a time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
