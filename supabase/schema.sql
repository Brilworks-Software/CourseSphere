-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.course_announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_published boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  send_email boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT course_announcements_pkey PRIMARY KEY (id),
  CONSTRAINT course_announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_announcements_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);
CREATE TABLE public.course_rating_stats (
  course_id uuid NOT NULL,
  avg_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  rating_1 integer DEFAULT 0,
  rating_2 integer DEFAULT 0,
  rating_3 integer DEFAULT 0,
  rating_4 integer DEFAULT 0,
  rating_5 integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT course_rating_stats_pkey PRIMARY KEY (course_id),
  CONSTRAINT course_rating_stats_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_sections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT course_sections_pkey PRIMARY KEY (id),
  CONSTRAINT course_sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  instructor_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  thumbnail_url text,
  primary_category text,
  sub_category text,
  organization_id uuid,
  is_free boolean NOT NULL DEFAULT true,
  price bigint NOT NULL DEFAULT '0'::bigint,
  subtitle text,
  language text DEFAULT 'en'::text,
  level text CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all_levels'::text])),
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'in_review'::text, 'published'::text, 'rejected'::text])),
  seo_keywords ARRAY,
  last_submitted_at timestamp with time zone,
  published_at timestamp with time zone,
  razorpay_connected boolean NOT NULL DEFAULT false,
  razorpay_key text,
  requirements text,
  expectations text,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id),
  CONSTRAINT courses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  video_url text,
  duration integer,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  section_id uuid,
  order_index integer DEFAULT 1,
  description text,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT lessons_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.course_sections(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  logo_url text,
  website text,
  owner_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  thumbnail_url text,
  category ARRAY,
  sub_category ARRAY,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'student'::text])),
  theme text NOT NULL DEFAULT 'system'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  avatar_url text,
  bio text,
  institute_name text,
  website text,
  is_org_owner boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'student'::text])),
  bio text,
  theme text DEFAULT 'system'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  institute_name text,
  website text,
  is_org_owner boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone,
  email text,
  gender text,
  first_name text,
  last_name text,
  profile_picture_url text,
  organization_id uuid,
  is_verified boolean,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);