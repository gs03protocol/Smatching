import { useState } from "react";

const ITEMS = [
  { key: "gps", label: "위치정보(GPS) 수집 이용 동의", required: true },
  { key: "service", label: "서비스 이용약관 동의", required: true },
  { key: "third_party", label: "매칭을 위한 제3자(상대 학생) 정보 제공 동의", required: true },
  { key: "marketing", label: "이벤트/알림 수신 동의 (선택)", required: false },
];

interface Props {
  onNext: (consents: Record<string, boolean>) => void;
}

export default function ConsentChecklist({ onNext }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const allChecked = ITEMS.every((item) => checks[item.key]);
  const requiredChecked = ITEMS.filter((i) => i.required).every((item) => checks[item.key]);

  function toggleAll(value: boolean) {
    setChecks(Object.fromEntries(ITEMS.map((i) => [i.key, value])));
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm w-full mx-auto">
      <h2 className="text-lg font-bold">추가 이용 동의</h2>
      <label className="flex items-center gap-2 py-2 border-b font-medium cursor-pointer">
        <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} />
        모두 동의합니다
      </label>
      {ITEMS.map((item) => (
        <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!checks[item.key]}
            onChange={(e) => setChecks((c) => ({ ...c, [item.key]: e.target.checked }))}
          />
          {item.label} {item.required && <span className="text-brand-500" style={{ color: "var(--color-brand-500)" }}>(필수)</span>}
        </label>
      ))}
      <button
        className="mt-4 py-3 rounded-full btn-brand-solid font-semibold disabled:opacity-40"
        disabled={!requiredChecked}
        onClick={() => onNext(checks)}
      >
        다음
      </button>
    </div>
  );
}
