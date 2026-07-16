import type { TimeSlot } from "../lib/api";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

interface Props {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

export default function TimeSlotEditor({ slots, onChange }: Props) {
  function update(idx: number, patch: Partial<TimeSlot>) {
    onChange(slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function add() {
    onChange([...slots, { day: "월", start: "15:00", end: "17:00" }]);
  }
  function remove(idx: number) {
    onChange(slots.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <h3 className="font-semibold text-sm text-gray-700">멘토링 가능 시간대 (최소 1개)</h3>
      {slots.map((slot, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={slot.day}
            onChange={(e) => update(idx, { day: e.target.value })}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}요일
              </option>
            ))}
          </select>
          <input
            type="time"
            className="border rounded px-2 py-1 text-sm"
            value={slot.start}
            onChange={(e) => update(idx, { start: e.target.value })}
          />
          <span className="text-gray-400">~</span>
          <input
            type="time"
            className="border rounded px-2 py-1 text-sm"
            value={slot.end}
            onChange={(e) => update(idx, { end: e.target.value })}
          />
          {slots.length > 1 && (
            <button
              type="button"
              className="ml-auto text-gray-400 hover:text-red-500 px-2"
              onClick={() => remove(idx)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start px-3 py-1.5 rounded-full btn-brand text-sm font-medium"
      >
        + 시간대 추가
      </button>
    </div>
  );
}
