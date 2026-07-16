import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConsentChecklist from "../components/ConsentChecklist";
import TimeSlotEditor from "../components/TimeSlotEditor";
import SubjectPicker from "../components/SubjectPicker";
import { api } from "../lib/api";
import type { NeisResult, SubjectChoice, SubjectTree, TimeSlot } from "../lib/api";
import { getCurrentPosition, reverseGeocodeToCity } from "../lib/geocode";

type Step = 0 | 1 | 2 | 3 | 4;

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [tree, setTree] = useState<SubjectTree | null>(null);

  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [city, setCity] = useState("");
  const [locating, setLocating] = useState(false);

  const [neis, setNeis] = useState<NeisResult | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slots, setSlots] = useState<TimeSlot[]>([{ day: "월", start: "15:00", end: "17:00" }]);

  const [nickname, setNickname] = useState("");
  const [nicknameOk, setNicknameOk] = useState<boolean | null>(null);
  const [showTeach, setShowTeach] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [teachSubject, setTeachSubject] = useState<SubjectChoice | null>(null);
  const [learnSubject, setLearnSubject] = useState<SubjectChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.subjects().then(setTree).catch(() => setError("과목 정보를 불러오지 못했습니다."));
  }, []);

  async function handleLocate() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const found = await reverseGeocodeToCity(pos.coords.latitude, pos.coords.longitude);
      if (found) setCity(found);
    } catch {
      // 위치 권한 거부/미지원 시 수동 입력으로 폴백
    } finally {
      setLocating(false);
    }
  }

  // 위치 확인 단계에 들어오면 버튼을 누르지 않아도 자동으로 GPS 위치를 받아온다.
  useEffect(() => {
    if (step === 1 && !city) {
      handleLocate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const html = await file.text();
    try {
      const result = await api.uploadNeis(html);
      setNeis(result);
      const initialVisible: Record<string, boolean> = {};
      Object.keys(result.subjects).forEach((k) => (initialVisible[k] = true));
      setVisible(initialVisible);
    } catch (err: any) {
      setError(err.message || "생기부 파싱에 실패했습니다.");
    }
  }

  async function checkNickname() {
    if (!nickname.trim()) return;
    const { available } = await api.nicknameCheck(nickname.trim());
    setNicknameOk(available);
    if (available) setShowTeach(true);
  }

  async function handleFinish() {
    setError("");
    if (!teachSubject && !learnSubject) {
      setError("가르칠 과목 또는 배울 과목 중 최소 1개는 입력해야 합니다.");
      return;
    }
    setSaving(true);
    try {
      const subjectGrades: Record<string, any> = {};
      if (neis) {
        for (const [track, g] of Object.entries(neis.subjects)) {
          if (!g) continue;
          subjectGrades[track] = { ...g, visible: !!visible[track] };
        }
      }
      await api.saveProfile({
        nickname: nickname.trim(),
        city: city || null,
        schoolName: neis?.school ?? null,
        gradeLevel: neis?.grade ?? null,
        subjectGrades,
        teachSubject,
        learnSubject,
        availableTimes: slots,
        consents,
      });
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!tree) return null;

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {step === 0 && (
          <ConsentChecklist
            onNext={(c) => {
              setConsents(c);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">위치 확인</h2>
            <p className="text-sm text-gray-500">
              {locating
                ? "현재 위치를 확인하는 중이에요..."
                : "현재 위치를 기반으로 시/도를 자동으로 채웠어요. 다르면 직접 수정해주세요."}
            </p>
            <button className="py-2 rounded-full btn-brand text-sm font-medium" onClick={handleLocate} disabled={locating}>
              {locating ? "위치 확인 중..." : "위치 다시 확인하기"}
            </button>
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="예: 경산시, 서울특별시"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button className="py-3 rounded-full btn-brand-solid font-semibold" onClick={() => setStep(2)}>
              다음
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">생기부 업로드</h2>
            <p className="text-sm text-gray-500">
              NEIS 학교생활기록부 HTML 파일을 업로드하면 학교/학년/과목별 등급을 자동으로 채워드려요.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 rounded-full btn-brand text-sm font-semibold border-2 border-dashed"
              style={{ borderColor: "var(--color-brand-400)" }}
            >
              📎 생기부 HTML 파일 첨부하기
            </button>
            {fileName && <p className="text-xs text-gray-500 -mt-2">첨부됨: {fileName}</p>}
            {neis && (
              <div className="bg-orange-50 rounded-lg p-3 text-sm flex flex-col gap-2">
                <div>
                  학교: <b>{neis.school ?? "확인 불가"}</b> / 학년: <b>{neis.grade ?? "확인 불가"}</b>
                </div>
                {Object.entries(neis.subjects).map(([track, g]) =>
                  g ? (
                    <label key={track} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!visible[track]}
                        onChange={(e) => setVisible((v) => ({ ...v, [track]: e.target.checked }))}
                      />
                      {track} 평균 등급 {g.avg} — 프로필에 표시
                    </label>
                  ) : null
                )}
              </div>
            )}
            <button className="py-3 rounded-full btn-brand-solid font-semibold" onClick={() => setStep(3)}>
              다음
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <TimeSlotEditor slots={slots} onChange={setSlots} />
            <button
              className="py-3 rounded-full btn-brand-solid font-semibold disabled:opacity-40"
              disabled={slots.length < 1}
              onClick={() => setStep(4)}
            >
              다음
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-sm text-gray-700">닉네임</h3>
              <div className="flex gap-2">
                <input
                  className="border rounded px-3 py-2 text-sm flex-1"
                  placeholder="닉네임 입력"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameOk(null);
                  }}
                />
                <button className="px-3 py-2 rounded btn-brand text-sm" onClick={checkNickname}>
                  확인
                </button>
              </div>
              {nicknameOk === true && <span className="text-green-600 text-xs">사용 가능한 닉네임이에요.</span>}
              {nicknameOk === false && <span className="text-red-500 text-xs">이미 사용 중인 닉네임이에요.</span>}
            </div>

            {showTeach && tree && (
              <SubjectPicker tree={tree} label="가르칠 수 있는 과목" value={teachSubject} onChange={setTeachSubject} />
            )}
            {showTeach && !showLearn && (
              <button className="self-start px-3 py-1.5 rounded-full btn-brand text-sm" onClick={() => setShowLearn(true)}>
                다음: 배우고 싶은 과목 입력 →
              </button>
            )}

            {showLearn && tree && (
              <SubjectPicker tree={tree} label="배우고 싶은 과목" value={learnSubject} onChange={setLearnSubject} />
            )}

            {showLearn && (
              <button
                className="py-3 rounded-full btn-brand-solid font-semibold disabled:opacity-40"
                disabled={saving}
                onClick={handleFinish}
              >
                {saving ? "저장 중..." : "프로필 완성하기"}
              </button>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
