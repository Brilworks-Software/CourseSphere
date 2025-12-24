import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseClient";

// Helper: parse JSON body
async function parseBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// GET: fetch organization by organization_id (from query param)
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const organization_id = searchParams.get("organization_id");
  if (!organization_id)
    return NextResponse.json(
      { error: "Missing organization_id" },
      { status: 400 }
    );

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organization_id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });

  // Map DB fields to API fields for consistency
  const mapped = {
    ...data,
    categories: data.category ?? [],
    subcategories: data.sub_category ?? [],
  };
  return NextResponse.json(mapped);
}

// POST: create organization (all details from body)
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body: any = await parseBody(req);

  // Only require name and owner_id for creation
  if (!body.name || !body.owner_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Generate slug from name (lowercase, replace spaces with hyphens)
  const slug = body.name.trim().toLowerCase().replaceAll(" ", "-");

  // Insert organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert([
      {
        name: body.name,
        slug,
        logo_url: body.logo_url,
        owner_id: body.owner_id,
      },
    ])
    .select()
    .single();
  if (orgError)
    return NextResponse.json({ error: orgError.message }, { status: 400 });

  // Update user's organization_id in users table
  const { error: userError } = await supabase
    .from("users")
    .update({ organization_id: org.id })
    .eq("id", body.owner_id);
  if (userError)
    return NextResponse.json({ error: userError.message }, { status: 400 });

  return NextResponse.json(org);
}

// PATCH: update organization by organization_id (from body)
export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();
  const body: any = await parseBody(req);

  if (!body.organization_id) {
    return NextResponse.json(
      { error: "Missing organization_id" },
      { status: 400 }
    );
  }

  // Only update provided fields (partial update)
  const updateFields: any = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.slug !== undefined) updateFields.slug = body.slug;
  if (body.description !== undefined)
    updateFields.description = body.description;
  if (body.logo_url !== undefined) updateFields.logo_url = body.logo_url;
  if (body.thumbnail_url !== undefined)
    updateFields.thumbnail_url = body.thumbnail_url;
  if (body.website !== undefined) updateFields.website = body.website;
  if (body.categories !== undefined) updateFields.category = body.categories;
  if (body.subcategories !== undefined)
    updateFields.sub_category = body.subcategories;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updateFields)
    .eq("id", body.organization_id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Map DB fields to API fields for consistency
  const mapped = {
    ...data,
    categories: data.category ?? [],
    subcategories: data.sub_category ?? [],
  };
  return NextResponse.json(mapped);
}
