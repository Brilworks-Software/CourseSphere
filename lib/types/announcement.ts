export interface CourseAnnouncement {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  message: string;
  is_published: boolean;
  is_pinned: boolean;
  send_email: boolean;
  created_at: string;
  updated_at: string;
  instructor?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_picture_url?: string;
  };
}
