"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { COURSE_CATEGORIES } from "@/app/util/course_category";

type CourseFilters = {
  search?: string;
  primary_category?: string;
  sub_category?: string;
  is_free?: boolean;
  minPrice?: number;
  maxPrice?: number;
};

export function CourseFilters({
  filters,
  setFilters,
}: {
  filters: CourseFilters;
  setFilters: (filters: CourseFilters) => void;
}) {
  const [priceRange, setPriceRange] = useState([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 5000,
  ]);

  const activeCategory = COURSE_CATEGORIES.find(
    (c) => c.value === filters.primary_category
  );

  return (
    <aside className="w-full md:w-72 p-6 rounded-2xl bg-sidebar shadow space-y-6">
      {/* 🔍 Search */}
      <Input
        placeholder="Search courses"
        value={filters.search ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, search: e.target.value })
        }
      />

      <Accordion type="multiple" className="space-y-4">
        {/* CATEGORY */}
        <FilterItem title="Category">
          <div className="space-y-2">
            {COURSE_CATEGORIES.map((cat) => (
              <div key={cat.value} className="flex items-center gap-3">
                <Checkbox
                  checked={filters.primary_category === cat.value}
                  onCheckedChange={() =>
                    setFilters({
                      ...filters,
                      primary_category: cat.value,
                      sub_category: undefined,
                    })
                  }
                />
                <span className="text-sm">{cat.label}</span>
              </div>
            ))}
          </div>
        </FilterItem>

        {/* SUB CATEGORY */}
        <FilterItem title="Sub Category">
          {!activeCategory ? (
            <p className="text-sm italic text-muted-foreground">
              Select a category first
            </p>
          ) : (
            <div className="space-y-2">
              {activeCategory.children.map((sub) => (
                <div key={sub.value} className="flex items-center gap-3">
                  <Checkbox
                    checked={filters.sub_category === sub.value}
                    onCheckedChange={() =>
                      setFilters({ ...filters, sub_category: sub.value })
                    }
                  />
                  <span className="text-sm">{sub.label}</span>
                </div>
              ))}
            </div>
          )}
        </FilterItem>

        {/* PRICE */}
        <FilterItem title="Price">
          <div className="flex items-center justify-between">
            <span className="text-sm">Free courses only</span>
            <Switch
              checked={filters.is_free ?? false}
              onCheckedChange={(v) =>
                setFilters({ ...filters, is_free: v })
              }
            />
          </div>
          <div className="py-2 pt-5">
            <Slider
              min={0}
              max={5000}
              step={100}
              value={priceRange}
              onValueChange={(v) => {
                setPriceRange(v);
                setFilters({
                  ...filters,
                  minPrice: v[0],
                  maxPrice: v[1],
                });
              }}
            />
            <p className="text-sm mt-2">
              ₹{priceRange[0]} – ₹{priceRange[1]}
            </p>
          </div>
        </FilterItem>

      </Accordion>
    </aside>
  );
}

/* ---------------------------------- */
/* Reusable Accordion Item */
/* ---------------------------------- */
function FilterItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-sm font-medium">
        {title}
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
