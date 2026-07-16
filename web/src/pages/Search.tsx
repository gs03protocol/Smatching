import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubjectPicker from "../components/SubjectPicker";
import { api } from "../lib/api";
import type { SubjectChoice, SubjectTree } from "../lib/api";

// 멘티가 멘토를 고르는 방향만 지원한다 (멘토가 멘티를 고르는 흐름은 없음).
const role = "learn" as const;
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function Search() {
  const navigate = useNavigate();

  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [subject, setSubject] = useState<SubjectChoice | null>(null);
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
  const [useTimeFilter, setUseTimeFilter] = useState(false);
  const [day, setDay] = useState("월");
  const [start, setStart] = useState("15:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState("");

  useEffect(() => {
    api.subjects().then(setTree);
  }, []);

  function handleSearch() {
    if (!subject?.grade || !subject.track || !subject.subject) {
      setError("학년/계열/세부과목을 모두 선택해주세요.");
      return;
    }
    navigate("/results", {
      state: {
        role,
        criteria: {
          grade: subject.grade,
          track: subject.track,
          subject: subject.subject,
          school: school || undefined,
          city: city || undefined,
          timeSlots: useTimeFilter ? [{ day, start, end }] : undefined,
        },
      },
    });
  }

  if (!tree) return null;

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">멘토 고르기 — 배울 과목 선택</h1>

      <SubjectPicker tree={tree} label="과목 (필수)" value={subject} onChange={setSubject} />

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-gray-700">추가 조건 (선택)</h3>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="멘토의 학교"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="지역(시)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm mt-1 cursor-pointer">
          <input type="checkbox" checked={useTimeFilter} onChange={(e) => setUseTimeFilter(e.target.checked)} />
          멘토링 가능 시간대 조건 추가
        </label>
        {useTimeFilter && (
          <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
            <select className="border rounded px-2 py-1 text-sm" value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}요일
                </option>
              ))}
            </select>
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <span className="text-gray-400">~</span>
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button className="py-3 rounded-full btn-brand-solid font-semibold" onClick={handleSearch}>
        검색하기
      </button>
    </div>
  );
}
