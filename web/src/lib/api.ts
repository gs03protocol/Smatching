import { getDeviceId } from "./deviceId";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `요청 실패 (${res.status})`);
  }
  return data as T;
}

export const api = {
  subjects: () => request<SubjectTree>("/subjects"),
  nicknameCheck: (nickname: string) =>
    request<{ available: boolean }>(`/nickname-check?nickname=${encodeURIComponent(nickname)}`),
  uploadNeis: (html: string) =>
    request<NeisResult>("/upload-neis", { method: "POST", body: JSON.stringify({ html }) }),
  getProfile: () => request<Profile | null>("/profile"),
  saveProfile: (profile: Partial<Profile>) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(profile) }),
  setReady: (body: { teachReady?: boolean; learnReady?: boolean }) =>
    request<Profile>("/profile/ready", { method: "PUT", body: JSON.stringify(body) }),
  candidates: (role: "teach" | "learn", criteria: any) =>
    request<any[]>("/candidates", { method: "POST", body: JSON.stringify({ role, criteria }) }),
  sendRequest: (toUserId: string, role: "teach" | "learn") =>
    request<any>("/request", { method: "POST", body: JSON.stringify({ toUserId, role }) }),
  notifications: (since?: string) =>
    request<{ id: number; createdAt: string; message: string }[]>(
      `/notifications${since ? `?since=${encodeURIComponent(since)}` : ""}`
    ),
};

export interface SubjectTree {
  tracks: string[];
  grades: Record<string, Record<string, string[]>>;
}

export interface NeisResult {
  school: string | null;
  grade: number | null;
  subjects: Partial<Record<string, { avg: number; count: number }>>;
}

export interface TimeSlot {
  day: string;
  start: string;
  end: string;
}

export interface SubjectChoice {
  grade: number;
  track: string;
  subject: string;
}

export interface Profile {
  id: string;
  nickname: string;
  city?: string | null;
  schoolName?: string | null;
  gradeLevel?: number | null;
  subjectGrades?: Record<string, { avg: number; count: number; visible: boolean }> | null;
  teachSubject?: SubjectChoice | null;
  learnSubject?: SubjectChoice | null;
  availableTimes?: TimeSlot[] | null;
  teachReady: boolean;
  learnReady: boolean;
  consents?: Record<string, boolean> | null;
}
