"""멘티가 '멘토 고르기'를 눌렀을 때 호출되는 Vercel Python 서버리스 함수.
criteria.subjectField 는 항상 "teachSubject" (멘토가 가르칠 수 있는 과목과 매칭).
"""
from http.server import BaseHTTPRequestHandler
import json
from scoring import score_candidates


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        criteria = {**body.get("criteria", {}), "subjectField": "teachSubject"}
        result = score_candidates(criteria, body.get("candidates", []))
        payload = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
