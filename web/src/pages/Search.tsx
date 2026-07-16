import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SubjectPicker from "../components/SubjectPicker";
import { api } from "../lib/api";
import type { SubjectChoice, SubjectTree } from "../lib/api";

export default function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = (params.get("role") === "learn" ? "learn" : "teach") as "teach" | "learn";

  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [subject, setSubject] = useState<SubjectChoice | null>(null);
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
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
        },
      },
    });
  }

  if (!tree) return null;

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">
        {role === "teach" ? "멘티 고르기 — 가르칠 과목 선택" : "멘토 고르기 — 배울 과목 선택"}
      </h1>

      <SubjectPicker tree={tree} label="과목 (필수)" value={subject} onChange={setSubject} />

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-gray-700">추가 조건 (선택)</h3>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder={role === "teach" ? "멘티의 학교" : "멘토의 학교"}
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="지역(시)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button className="py-3 rounded-full btn-brand-solid font-semibold" onClick={handleSearch}>
        검색하기
      </button>
    </div>
  );
}
