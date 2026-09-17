// Raw Canvas REST shapes, limited to the fields EZCanvas reads.

export type CanvasProfile = {
  id: number;
  name: string;
  short_name: string;
  primary_email: string | null;
  login_id: string;
  avatar_url: string | null;
};

export type CanvasCourse = {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  term?: { id: number; name: string };
  teachers?: Array<{ id: number; display_name: string }>;
  syllabus_body?: string | null;
};

export type CanvasRubricCriterion = {
  id: string;
  description: string;
  long_description?: string | null;
  points: number;
};

export type CanvasSubmission = {
  submitted_at: string | null;
  workflow_state: string;
  score: number | null;
  late: boolean;
};

export type CanvasAssignment = {
  id: number;
  course_id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number | null;
  submission_types: string[];
  html_url: string;
  published: boolean;
  updated_at: string;
  group_category_id: number | null;
  rubric?: CanvasRubricCriterion[];
  submission?: CanvasSubmission;
};

export type CanvasModuleItem = {
  id: number;
  title: string;
  type: "File" | "Page" | "Assignment" | "ExternalUrl" | "ExternalTool" | "Discussion" | "Quiz" | "SubHeader";
  content_id?: number;
  page_url?: string;
  html_url?: string;
  external_url?: string;
  published?: boolean;
};

export type CanvasModule = {
  id: number;
  name: string;
  position: number;
  items?: CanvasModuleItem[];
};

export type CanvasFile = {
  id: number;
  display_name: string;
  filename: string;
  "content-type": string;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
};

export type CanvasPage = {
  url: string;
  title: string;
  html_url: string;
  updated_at: string;
  published: boolean;
};

export type CanvasAnnouncement = {
  id: number;
  title: string;
  message: string | null;
  posted_at: string | null;
  context_code: string;
  html_url: string;
  author?: { display_name: string };
};

export type CanvasCalendarEvent = {
  id: number;
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  context_code: string;
  location_name?: string | null;
  html_url: string;
  type: "event" | "assignment";
};

export type CanvasGroup = {
  id: number;
  name: string;
  course_id: number | null;
  group_category_id: number | null;
  members_count: number;
};

export type CanvasGroupUser = {
  id: number;
  name: string;
  sortable_name: string;
  avatar_url?: string | null;
};
