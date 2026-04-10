export type UserRole = "super_admin" | "admin" | "student";

export interface Profile {
  id: string;
  name: string | null;
  role: UserRole;
  theme: "light" | "dark" | "system";
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  is_active: boolean;
  created_at: string;
  instructor?: Profile;
  lessons?: Lesson[];
  _count?: {
    lessons: number;
  };
  isOwned?: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url: string;
  duration: number | null;
  created_at: string;
  course?: Course;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  created_at: string;
  course?: Course;
}

export type ConversationMessageRole = "user" | "assistant";

export interface ConversationMessage {
  id: string;
  user_id: string;
  course_id: string;
  role: ConversationMessageRole;
  content: string;
  word_count?: number;
  created_at: string;
}

export interface AIResponse {
  reply: string;
  wordCount: number;
  isTruncated: boolean;
  sources?: Array<{
    similarity_score: number;
    chunk_text: string;
    lesson_id: string;
  }>;
  searched: boolean;
  chunksUsed: number;
  success: boolean;
}
