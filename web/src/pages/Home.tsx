import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Profile, SubjectTree } from "../lib/api";
import ProfileEditModal from "../components/ProfileEditModal";

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const sinceRef = useRef(new Date().toISOString());

  useEffect(() => {
    Promise.all([api.getProfile(), api.subjects()]).then(([p, t]) => {
      if (!p) {
        navigate("/setup", { replace: true });
        return;
      }
      setProfile(p);
      setTree(t);
    });
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const list = await api.notifications(sinceRef.current);
        if (list.length) {
          setNotifications((prev) => [...prev, ...list]);
          sinceRef.current = list[list.length - 1].createdAt;
        }
      } catch {
        // 폴링 실패는 조용히 무시
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  async function toggleReady(field: "teachReady" | "learnReady") {
    if (!profile) return;
    const updated = await api.setReady({ [field]: !profile[field] } as any);
    setProfile(updated);
  }

  if (!profile || !tree) return null;

  const grades = profile.subjectGrades ?? {};

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6 max-w-md mx-auto">
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-bold">Smatching</h1>
        <button
          className="w-9 h-9 rounded-full btn-brand flex items-center justify-center"
          onClick={() => setEditing(true)}
          title="프로필 수정"
        >
          👤
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.id} className="bg-orange-100 text-orange-700 text-sm rounded-lg px-3 py-2">
              {n.message}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-2">
        <div className="text-lg font-bold">{profile.nickname}</div>
        <div className="text-sm text-gray-500">
          {[profile.city, profile.schoolName, profile.gradeLevel ? `고${profile.gradeLevel}` : null]
            .filter(Boolean)
            .join(" · ") || "위치/학교 정보 없음"}
        </div>

        {Object.entries(grades)
          .filter(([, g]) => g && g.visible)
          .map(([track, g]) => (
            <span key={track} className="inline-block text-xs bg-gray-100 rounded-full px-2 py-1 mr-1 w-fit">
              {track} {g!.avg}등급
            </span>
          ))}

        <div className="flex flex-col gap-1 mt-2 text-sm">
          {profile.teachSubject && (
            <div>
              가르칠 수 있는 과목: <b>{profile.teachSubject.subject}</b>
            </div>
          )}
          {profile.learnSubject && (
            <div>
              배우고 싶은 과목: <b>{profile.learnSubject.subject}</b>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold ${
              profile.teachReady ? "btn-brand-solid" : "btn-brand"
            } disabled:opacity-40`}
            disabled={!profile.teachSubject}
            onClick={() => toggleReady("teachReady")}
          >
            가르치기 {profile.teachReady ? "준비완료 ✓" : "준비 안 함"}
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold ${
              profile.learnReady ? "btn-brand-solid" : "btn-brand"
            } disabled:opacity-40`}
            disabled={!profile.learnSubject}
            onClick={() => toggleReady("learnReady")}
          >
            배우기 {profile.learnReady ? "준비완료 ✓" : "준비 안 함"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="py-4 rounded-full btn-brand-solid font-semibold"
          onClick={() => navigate("/search?role=teach")}
        >
          멘티 고르기 (가르치기)
        </button>
        <button
          className="py-4 rounded-full btn-brand-solid font-semibold"
          onClick={() => navigate("/search?role=learn")}
        >
          멘토 고르기 (배우기)
        </button>
      </div>

      {editing && (
        <ProfileEditModal
          profile={profile}
          tree={tree}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setProfile(p);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
