import { useState } from "react";
import SubjectPicker from "./SubjectPicker";
import TimeSlotEditor from "./TimeSlotEditor";
import { api } from "../lib/api";
import type { Profile, SubjectTree } from "../lib/api";

interface Props {
  profile: Profile;
  tree: SubjectTree;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}

export default function ProfileEditModal({ profile, tree, onClose, onSaved }: Props) {
  const [gradeLevel, setGradeLevel] = useState<number | null>(profile.gradeLevel ?? null);
  const [teachSubject, setTeachSubject] = useState(profile.teachSubject ?? null);
  const [learnSubject, setLearnSubject] = useState(profile.learnSubject ?? null);
  const [slots, setSlots] = useState(profile.availableTimes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!teachSubject && !learnSubject) {
      setError("가르칠 과목 또는 배울 과목 중 최소 1개는 필요합니다.");
      return;
    }
    if (slots.length < 1) {
      setError("멘토링 가능 시간대는 최소 1개 필요합니다.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.saveProfile({
        nickname: profile.nickname,
        city: profile.city,
        schoolName: profile.schoolName,
        gradeLevel,
        subjectGrades: profile.subjectGrades,
        teachSubject,
        learnSubject,
        availableTimes: slots,
        consents: profile.consents,
      });
      onSaved(updated);
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold">프로필 수정</h2>

        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-sm text-gray-700">학년</h3>
          <select
            className="border rounded px-2 py-1.5 text-sm"
            value={gradeLevel ?? ""}
            onChange={(e) => setGradeLevel(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">선택 안 함</option>
            <option value={1}>고1</option>
            <option value={2}>고2</option>
            <option value={3}>고3</option>
          </select>
        </div>

        <SubjectPicker tree={tree} label="가르칠 수 있는 과목" value={teachSubject} onChange={setTeachSubject} />
        <SubjectPicker tree={tree} label="배우고 싶은 과목" value={learnSubject} onChange={setLearnSubject} />
        <TimeSlotEditor slots={slots} onChange={setSlots} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button className="flex-1 py-2 rounded-lg border text-gray-600" onClick={onClose}>
            취소
          </button>
          <button className="flex-1 py-2 rounded-lg btn-brand-solid disabled:opacity-40" disabled={saving} onClick={save}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
