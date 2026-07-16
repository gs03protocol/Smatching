import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConsentModal from "../components/ConsentModal";
import { api } from "../lib/api";

type Stage = "loading" | "logo" | "consent" | "needProfile";

export default function Landing() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("loading");

  useEffect(() => {
    api
      .getProfile()
      .then((profile) => {
        if (profile) navigate("/home", { replace: true });
        else setStage("logo");
      })
      .catch(() => setStage("logo"));
  }, [navigate]);

  if (stage === "loading") return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-16 px-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center text-6xl shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--color-brand-400), var(--color-brand-600))" }}
        >
          🎓
        </div>
        <h1 className="text-4xl font-extrabold" style={{ color: "var(--color-brand-600)" }}>
          Smatching
        </h1>
        <p className="text-gray-500 text-center">
          고등학생을 위한 1:1 멘토링 매칭 서비스
        </p>
      </div>

      {stage === "logo" && (
        <button
          className="w-full max-w-xs py-4 rounded-full btn-brand-solid text-lg font-semibold"
          onClick={() => setStage("consent")}
        >
          시작하기
        </button>
      )}

      {stage === "needProfile" && (
        <div className="w-full max-w-xs flex flex-col items-center gap-4">
          <p className="text-center text-gray-700 font-medium">
            Smatching 서비스를 이용하기 위해서 프로필 설정이 필요해요!
          </p>
          <button
            className="w-full py-4 rounded-full btn-brand-solid text-lg font-semibold"
            onClick={() => navigate("/setup")}
          >
            프로필 설정하기
          </button>
        </div>
      )}

      {stage === "consent" && (
        <ConsentModal onCancel={() => setStage("logo")} onAgree={() => setStage("needProfile")} />
      )}
    </div>
  );
}
