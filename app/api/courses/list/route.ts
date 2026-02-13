import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept both 'category' and 'primary_category' for compatibility
    const search = searchParams.get("search");
    const primary_category =
      searchParams.get("primary_category") || searchParams.get("category");
    const sub_category = searchParams.get("sub_category");
    const is_free = searchParams.get("is_free");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const page = Number(searchParams.get("page") || 1);
    const perPage = Number(searchParams.get("perPage") || 12);

    // User info for ownership logic
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    const supabase = createClient();

    // Join organization info and lessons count for each course
    let query = supabase
      .from("courses")
      .select(
        "*, organization:organization_id(id, name, slug, logo_url, thumbnail_url), lessons(count)",
        { count: "exact" },
      )
      .eq("is_active", true);

    /* ------------------ Filters ------------------ */
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    if (primary_category && primary_category !== "all") {
      query = query.eq("primary_category", primary_category);
    }
    if (sub_category && sub_category !== "all") {
      query = query.eq("sub_category", sub_category);
    }
    if (is_free === "1" || is_free === "true") {
      query = query.eq("is_free", true);
    }
    if (minPrice !== null && minPrice !== undefined && minPrice !== "") {
      query = query.gte("price", Number(minPrice));
    }
    if (maxPrice !== null && maxPrice !== undefined && maxPrice !== "") {
      query = query.lte("price", Number(maxPrice));
    }

    /* ------------------ Sorting ------------------ */
    const sortConfig: Record<string, { column: string; ascending: boolean }> = {
      oldest: { column: "created_at", ascending: true },
      newest: { column: "created_at", ascending: false },
      price_asc: { column: "price", ascending: true },
      price_desc: { column: "price", ascending: false },
      title_asc: { column: "title", ascending: true },
      title_desc: { column: "title", ascending: false },
    };
    const { column, ascending } = sortConfig[sort] ?? sortConfig.newest;
    query = query.order(column, { ascending });

    /* ------------------ Pagination ------------------ */
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map organization info to a top-level key for each course
    let courses = (data || []).map((course: any) => {
      const { organization, ...rest } = course;
      return {
        ...rest,
        organization: organization || null,
      };
    });

    // If admin, add isOwned key for each course
    if (role === "admin" && userId) {
      courses = courses.map((course: any) => ({
        ...course,
        isOwned: course.instructor_id === userId,
      }));
    }

    return NextResponse.json({
      courses,
      meta: {
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
