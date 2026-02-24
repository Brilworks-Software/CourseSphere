-- ============================================================
-- CERTIFICATE FEATURE — Run this in the Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. lesson_progress
--    Tracks when a student opens / completes every lesson.
--    One row per (student_id, lesson_id) — enforced via UNIQUE.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.lesson_progress (
  id              uuid        NOT NULL DEFAULT uuid_generate_v4(),
  student_id      uuid        NOT NULL,
  course_id       uuid        NOT NULL,
  lesson_id       uuid        NOT NULL,
  section_id      uuid,
  is_completed    boolean     NOT NULL DEFAULT false,
  opened_at       timestamptz          DEFAULT timezone('utc', now()),
  completed_at    timestamptz,
  watch_duration  integer              DEFAULT 0,   -- total seconds watched (optional)

  CONSTRAINT lesson_progress_pkey   PRIMARY KEY (id),
  CONSTRAINT lesson_progress_unique UNIQUE (student_id, lesson_id),

  CONSTRAINT lesson_progress_student_fkey
    FOREIGN KEY (student_id) REFERENCES public.users(id)           ON DELETE CASCADE,
  CONSTRAINT lesson_progress_course_fkey
    FOREIGN KEY (course_id)  REFERENCES public.courses(id)         ON DELETE CASCADE,
  CONSTRAINT lesson_progress_lesson_fkey
    FOREIGN KEY (lesson_id)  REFERENCES public.lessons(id)         ON DELETE CASCADE,
  CONSTRAINT lesson_progress_section_fkey
    FOREIGN KEY (section_id) REFERENCES public.course_sections(id) ON DELETE SET NULL
);

-- Fast lookup: "how many lessons has student X completed in course Y?"
CREATE INDEX idx_lesson_progress_student_course
  ON public.lesson_progress (student_id, course_id, is_completed);


-- ──────────────────────────────────────────────────────────
-- 2. course_certificates
--    Issued once a student completes 100 % of a course.
--    One row per (student_id, course_id) — enforced via UNIQUE.
-- ──────────────────────────────────────────────────────────
CREATE TABLE public.course_certificates (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4(),
  -- Human-readable certificate ID, e.g. CERT-2026-A1B2C3D4
  certificate_number  text        NOT NULL UNIQUE,
  student_id          uuid        NOT NULL,
  course_id           uuid        NOT NULL,

  -- Snapshot fields — stored so the certificate is unchanged even if
  -- the user or course details change later.
  student_name        text        NOT NULL,
  course_name         text        NOT NULL,
  instructor_name     text,
  organization_name   text,

  issued_at           timestamptz NOT NULL DEFAULT timezone('utc', now()),
  expires_at          timestamptz,          -- NULL = never expires

  total_lessons       integer     NOT NULL DEFAULT 0,
  total_hours         numeric(6,2)         DEFAULT 0,  -- course duration in hours

  CONSTRAINT course_certificates_pkey   PRIMARY KEY (id),
  CONSTRAINT course_certificates_unique UNIQUE (student_id, course_id),

  CONSTRAINT course_certificates_student_fkey
    FOREIGN KEY (student_id) REFERENCES public.users(id)   ON DELETE CASCADE,
  CONSTRAINT course_certificates_course_fkey
    FOREIGN KEY (course_id)  REFERENCES public.courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_certificates_student
  ON public.course_certificates (student_id);


-- ──────────────────────────────────────────────────────────
-- 3. Helper function — generate a certificate number
--    Call: SELECT generate_certificate_number();
--    Returns something like: CERT-2026-3F8A12C9
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'CERT-' || EXTRACT(YEAR FROM now())::text
         || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;
