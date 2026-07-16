import type { SubjectChoice, SubjectTree } from "../lib/api";

interface Props {
  tree: SubjectTree;
  value: SubjectChoice | null;
  onChange: (value: SubjectChoice | null) => void;
  label: string;
}

export default function SubjectPicker({ tree, value, onChange, label }: Props) {
  const grade = value?.grade ?? null;
  const track = value?.track ?? null;
  const subject = value?.subject ?? null;

  const tracksForGrade = grade ? Object.keys(tree.grades[String(grade)] ?? {}) : [];
  const subjectsForTrack = grade && track ? tree.grades[String(grade)]?.[track] ?? [] : [];

  return (
    <div className="flex flex-col gap-2 w-full">
      <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
      <div className="flex gap-2 flex-wrap">
        <select
          className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[90px]"
          value={grade ?? ""}
          onChange={(e) => {
            const g = e.target.value ? Number(e.target.value) : null;
            onChange(g ? { grade: g, track: "", subject: "" } : null);
          }}
        >
          <option value="">학년 선택</option>
          <option value={1}>고1</option>
          <option value={2}>고2</option>
          <option value={3}>고3</option>
        </select>

        <select
          className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[90px]"
          value={track ?? ""}
          disabled={!grade}
          onChange={(e) => onChange(grade ? { grade, track: e.target.value, subject: "" } : null)}
        >
          <option value="">계열 선택</option>
          {tracksForGrade.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[120px]"
          value={subject ?? ""}
          disabled={!track}
          onChange={(e) => onChange(grade && track ? { grade, track, subject: e.target.value } : null)}
        >
          <option value="">세부과목 선택</option>
          {subjectsForTrack.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
