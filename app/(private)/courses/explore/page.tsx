"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CourseFilters } from "./filter";
import CourseCard from "@/components/course-card";

type Product = any;

function buildQuery(filters: any) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.sub_category) params.set("sub_category", filters.sub_category);
  if (filters.minPrice !== undefined)
    params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined)
    params.set("maxPrice", String(filters.maxPrice));
  if (filters.festival) params.set("festival", filters.festival);
  if (filters.deity) params.set("deity", filters.deity);
  if (filters.tags && filters.tags.length > 0)
    params.set("tags", filters.tags.join(","));
  if (filters.inStock) params.set("inStock", "1");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("perPage", String(filters.perPage));
  return params.toString();
}

async function fetchCoursesFromApi(qs: string) {
  const res = await fetch(`/api/courses/list?${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body?.error || "Failed to fetch courses");
  }
  return res.json();
}

export default function CourseExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // initial state derived from URL
  const initialFilters = useMemo(() => {
    const sp = Object.fromEntries(searchParams.entries());
    return {
      search: sp.search || "",
      category: sp.category || "",
      sub_category: sp.sub_category || "",
      minPrice: sp.minPrice ? Number(sp.minPrice) : 0,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : 5000,
      festival: sp.festival || "",
      deity: sp.deity || "",
      tags: sp.tags ? sp.tags.split(",").filter(Boolean) : [],
      inStock: sp.inStock === "1" || sp.inStock === "true",
      sort: sp.sort || "newest",
      page: sp.page ? Number(sp.page) : 1,
      perPage: sp.perPage ? Number(sp.perPage) : 12,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<any>(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: filters.page || 1,
    perPage: filters.perPage || 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // whenever filters change, sync URL and fetch
  useEffect(() => {
    // sync URL (replace, not push, so back button behavior is nicer)
    const qs = buildQuery(filters);
    router.replace(`${window.location.pathname}?${qs}`);

    setLoading(true);
    setError(null);
    fetchCoursesFromApi(qs)
      .then((data) => {
        setProducts(data.courses || []);
        setMeta(
          data.meta || {
            total: 0,
            page: filters.page || 1,
            perPage: filters.perPage || 12,
            totalPages: 1,
          }
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, router]);

  // helpers for pagination controls
  function goToPage(p: number) {
    setFilters((prev: any) => ({
      ...prev,
      page: Math.max(1, Math.min(p, meta.totalPages)),
    }));
  }
  function setSort(sort: string) {
    setFilters((prev: any) => ({ ...prev, sort, page: 1 }));
  }
  function setPerPage(perPage: number) {
    setFilters((prev: any) => ({ ...prev, perPage, page: 1 }));
  }

  return (
    <div className="p-4 container mx-auto">
      {/* Banner Section */}
      <div className="w-full h-44 rounded-2xl bg-card mb-6 relative overflow-hidden">
       <div className="w-full mx-auto rounded-full top-[-50%] h-44 absolute bg-primary blur-2xl"></div>
      <div className=" absolute bottom-0 left-0 p-4">
        <h1 className="text-5xl text-secondary-foreground font-bold">Courses</h1>
        <p>Learn from a variety of courses to enhance your skills and knowledge.</p>
      </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="md:w-80 w-full md:shrink-0">
          <div className="md:sticky md:top-8">
            <CourseFilters
              filters={filters}
              setFilters={(newF: any) =>
                setFilters((prev: any) => ({ ...prev, ...newF, page: 1 }))
              }
            />
          </div>
        </div>

        <div className="flex-1">
          {/* top bar: sort + per page */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm">Sort:</label>
              <Select value={filters.sort} onValueChange={setSort}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="price_asc">Price: Low → High</SelectItem>
                  <SelectItem value="price_desc">Price: High → Low</SelectItem>
                  <SelectItem value="title_asc">Title A → Z</SelectItem>
                  <SelectItem value="title_desc">Title Z → A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm">Per page:</label>
              <Select
                value={String(filters.perPage)}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: filters.perPage || 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded-xl shadow-sm flex flex-col p-4 bg-background animate-pulse"
                >
                  {/* Image skeleton */}
                  <div className="w-full relative">
                    <Skeleton className="w-full aspect-square rounded-md mb-2" />
                    <Skeleton className="absolute top-2 right-2 w-8 h-8 rounded-full" />
                  </div>
                  {/* Content skeleton */}
                  <div className="mt-3 flex flex-col gap-2 justify-between h-full">
                    <div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32 mb-1" />
                      </div>
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : products.length === 0 ? (
            <div>No course found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2  lg:grid-cols-3 gap-6">
                {products.map((course: any) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex gap-2">
                  <Button
                    variant={"secondary"}
                    onClick={() => goToPage(filters.page - 1)}
                    disabled={filters.page <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant={"secondary"}
                    onClick={() => goToPage(filters.page + 1)}
                    disabled={filters.page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>

                <div className="text-sm">
                  Page {meta.page} of {meta.totalPages} • {meta.total} items
                </div>

                <div className="flex gap-2 items-center">
                  {/* quick jump to page */}
                  <input
                    type="number"
                    min={1}
                    max={meta.totalPages}
                    value={filters.page}
                    onChange={(e) => goToPage(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
