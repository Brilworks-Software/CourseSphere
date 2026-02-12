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

  // Default filter values
  const defaultFilters: CourseFilters = {
    search: "",
    primary_category: undefined,
    sub_category: undefined,
    is_free: false,
    minPrice: 0,
    maxPrice: 5000,
  };

  function handleClearFilters() {
    setFilters(defaultFilters);
    setPriceRange([0, 5000]);
  }

  // Check if any filter is applied (not default)
  const isFilterApplied =
    (filters.search && filters.search !== "") ||
    filters.primary_category !== undefined ||
    filters.sub_category !== undefined ||
    filters.is_free === true ||
    filters.minPrice !== 0 ||
    filters.maxPrice !== 5000;

  // Add 'All' option to categories
  const categoriesWithAll = [
    { label: "All", value: "all", children: [{ label: "All", value: "all" }] },
    ...COURSE_CATEGORIES,
  ];

  const activeCategory = categoriesWithAll.find(
    (c) => c.value === (filters.primary_category || "all"),
  );

  // Helper to set subcategory and always set primary_category
  function handleSubCategoryChange(subValue: string) {
    if (activeCategory) {
      setFilters({
        ...filters,
        primary_category: activeCategory.value,
        sub_category: subValue,
      });
    }
  }

  return (
    <aside className="w-full md:w-72 p-6 rounded-2xl bg-sidebar shadow space-y-6">
      {/* 🔍 Search */}
      <Input
        placeholder="Search courses"
        value={filters.search ?? ""}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />

      {/* Clear Filters Button */}
      {isFilterApplied && (
        <button
          className="mt-2 mb-2 px-4 py-2 rounded bg-muted text-sm text-foreground hover:bg-accent border border-border"
          onClick={handleClearFilters}
          type="button"
        >
          Clear Filters
        </button>
      )}

      <Accordion type="multiple" className="space-y-4">
        {/* CATEGORY */}
        <FilterItem title="Category">
          <div className="space-y-2">
            {categoriesWithAll.map((cat) => (
              <div key={cat.value} className="flex items-center gap-3">
                <Checkbox
                  checked={(filters.primary_category || "all") === cat.value}
                  onCheckedChange={() => {
                    setFilters({
                      ...filters,
                      primary_category: cat.value,
                      sub_category: "all",
                    });
                  }}
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
                    checked={(filters.sub_category || "all") === sub.value}
                    onCheckedChange={() => {
                      setFilters({
                        ...filters,
                        primary_category: activeCategory.value,
                        sub_category: sub.value,
                      });
                    }}
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
              onCheckedChange={(v) => setFilters({ ...filters, is_free: v })}
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
      <AccordionContent className="pt-2">{children}</AccordionContent>
    </AccordionItem>
  );
}
