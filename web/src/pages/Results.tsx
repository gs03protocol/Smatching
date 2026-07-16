import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface LocationState {
  role: "learn"; // 멘티가 멘토를 고르는 방향만 지원
  criteria: Record<string, any>;
}

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state) {
      navigate("/home", { replace: true });
      return;
    }
    api
      .candidates(state.role, state.criteria)
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [state, navigate]);

  async function sendRequest(id: string) {
    if (!state) return;
    await api.sendRequest(id, state.role);
    setSentTo((prev) => new Set(prev).add(id));
  }

  if (!state) return null;

  return (
    <div className="min-h-screen p-6 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button className="text-gray-400" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold">가르치기 준비완료 학생</h1>
      </div>

      {loading && <p className="text-gray-400 text-sm">검색 중...</p>}
      {!loading && candidates.length === 0 && (
        <p className="text-gray-400 text-sm">조건에 맞는 학생이 아직 없어요.</p>
      )}

      <div className="flex flex-col gap-3">
        {candidates.map((c) => {
          const subjectInfo = c.teachSubject;
          return (
            <div
              key={c.id}
              className="flex items-center bg-white rounded-xl shadow px-4 py-3 gap-4"
            >
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{c.nickname}</span>
                  {typeof c._score === "number" && (
                    <span
                      className="text-xs font-semibold rounded-full px-2 py-0.5"
                      style={{ background: "var(--color-brand-100)", color: "var(--color-brand-700)" }}
                    >
                      적합도 {c._score}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {[c.city, c.schoolName, c.gradeLevel ? `고${c.gradeLevel}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {subjectInfo && (
                  <div className="text-sm">
                    가르칠 수 있는 과목: <b>{subjectInfo.subject}</b>
                  </div>
                )}
                {Array.isArray(c.availableTimes) && c.availableTimes.length > 0 && (
                  <div className="text-xs text-gray-500">
                    가능 시간:{" "}
                    {c.availableTimes
                      .map((t: { day: string; start: string; end: string }) => `${t.day} ${t.start}~${t.end}`)
                      .join(", ")}
                  </div>
                )}
              </div>
              <button
                className="px-4 py-2 rounded-full btn-brand-solid text-sm font-semibold whitespace-nowrap disabled:opacity-40"
                disabled={sentTo.has(c.id)}
                onClick={() => sendRequest(c.id)}
              >
                {sentTo.has(c.id) ? "요청 완료" : "대화 요청"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
