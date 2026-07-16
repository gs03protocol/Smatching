import { useState } from "react";

interface Props {
  onAgree: () => void;
  onCancel: () => void;
}

const TERMS_TEXT = `개인정보 수집 및 이용 동의 (필수)

1. 수집 항목: 닉네임, 업로드한 생기부에서 추출한 학교명/학년/과목별 등급, 위치(시/도), 멘토링 가능 시간대
2. 수집 목적: 학생 간 1:1 멘토링 상대 매칭 서비스 제공
3. 보유 기간: 서비스 이용 기간 동안 (탈퇴 시 즉시 파기)
4. 동의를 거부할 권리가 있으며, 동의하지 않을 경우 서비스 이용(매칭)이 제한됩니다.`;

export default function ConsentModal({ onAgree, onCancel }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-3">개인정보 수집·이용 동의</h2>
        <div className="border rounded-lg p-3 h-48 overflow-y-auto text-sm text-gray-600 whitespace-pre-line bg-gray-50">
          {TERMS_TEXT}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          위 내용에 동의합니다.
        </label>
        <div className="flex gap-2 mt-5">
          <button className="flex-1 py-2 rounded-lg border text-gray-600" onClick={onCancel}>
            취소
          </button>
          <button
            className="flex-1 py-2 rounded-lg btn-brand-solid disabled:opacity-40"
            disabled={!checked}
            onClick={onAgree}
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
