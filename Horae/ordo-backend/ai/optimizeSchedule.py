"""
============================================
🐍 HORAE AI 일정 최적화 엔진 (Python 버전)
============================================

📋 목적: 머신러닝 기반 일정 우선순위 예측 및 시간표 자동 생성
🎯 기능: 
  - 사전 훈련된 ML 모델을 통한 우선순위 예측
  - 시간대 최적화 및 충돌 방지 알고리즘
  - Node.js 백엔드와의 JSON 기반 통신

🔧 기술 스택:
  - scikit-learn (머신러닝)
  - pandas (데이터 처리)
  - numpy (수치 계산)

작성일: 2024년
작성자: HORAE 개발팀
버전: 1.0
"""

# 📦 필수 라이브러리 import
import pickle      # 훈련된 모델 로드용
import pandas as pd # 데이터프레임 처리
import sys         # 명령행 인자 처리
import json        # JSON 데이터 파싱
import numpy as np # 수치 연산

# 🤖 1. 사전 훈련된 우선순위 예측 모델 로드
try:
    with open("ordo-backend/ai/priority_model.pkl", "rb") as f:
        model = pickle.load(f)
    print("✅ 우선순위 예측 모델 로드 성공", file=sys.stderr)
except FileNotFoundError:
    print("❌ 모델 파일을 찾을 수 없습니다", file=sys.stderr)
    sys.exit(1)

# 📥 2. Node.js 백엔드로부터 JSON 입력 데이터 수신
try:
    input_json = sys.argv[1]
    data = json.loads(input_json)
    print(f"📊 입력 데이터 {len(data)}개 일정 수신", file=sys.stderr)
except (IndexError, json.JSONDecodeError) as e:
    print(f"❌ 입력 데이터 파싱 실패: {e}", file=sys.stderr)
    sys.exit(1)

# 📊 DataFrame으로 변환 (데이터 분석 최적화)
df = pd.DataFrame(data)

# 🔧 3. 추가 특성 엔지니어링 (모델 성능 향상을 위한 특성 생성)
df["flexible"] = df["flexible"].astype(int)                      # 유연성 점수 (0/1)
df["is_morning"] = (df["start_hour"] < 12).astype(int)          # 오전 일정 여부 (생체리듬 고려)
df["title_length"] = df["title"].apply(lambda x: len(x) if isinstance(x, str) else 0)  # 제목 길이 (복잡도 추정)

print("🔧 특성 엔지니어링 완료", file=sys.stderr)

# 🎯 4. 머신러닝 모델을 통한 우선순위 예측 (핵심 AI 기능)
features = df[["duration", "importance", "flexible", "start_hour", "is_morning", "title_length"]]
df["predicted_priority"] = model.predict(features)
print("🤖 AI 우선순위 예측 완료", file=sys.stderr)

# 📋 5. 지능형 일정 정렬 (다중 기준 최적화)
# 우선순위 > 중요도 > 소요시간 순으로 정렬하여 최적 배치 순서 결정
df = df.sort_values(by=["predicted_priority", "importance", "duration"], ascending=[False, False, False])
print("📊 일정 정렬 완료", file=sys.stderr)

# ⏰ 6. 시간표 초기화: 08:00 ~ 22:00 (총 840분, 14시간)
# 각 분단위를 0(빈 시간)/1(사용 중)로 표시하는 타임라인 배열
timeline = [0] * (22 - 8) * 60  # 8시부터 22시까지의 분단위 배열
results = []  # 최종 배치 결과 저장용

def find_slot(duration):
    """
    ⏰ 빈 시간 슬롯 찾기 함수
    
    Args:
        duration (int): 필요한 시간(분)
        
    Returns:
        int: 배치 가능한 시작 시간(분), 없으면 None
    """
    # 🔍 연속된 빈 시간 슬롯 탐색
    for i in range(len(timeline) - duration + 1):
        if all(v == 0 for v in timeline[i:i+duration]):
            # ✅ 적절한 슬롯 발견 시 해당 시간을 사용중으로 표시
            for j in range(duration):
                timeline[i + j] = 1
            return i + 8 * 60  # 실제 분으로 변환 (8시 기준)
    return None  # 배치 불가능

# 🎯 7. 최적화된 일정 배치 알고리즘 실행
print("🚀 일정 배치 시작...", file=sys.stderr)
placement_success = 0  # 성공적으로 배치된 일정 수 카운터

for idx, (_, row) in enumerate(df.iterrows()):
    # ⏰ 해당 일정을 위한 최적 시간 슬롯 탐색
    start_min = find_slot(int(row["duration"]))
    
    if start_min is not None:
        # ✅ 배치 성공: 시간 계산 및 결과 저장
        end_min = start_min + int(row["duration"])
        start_h = start_min // 60    # 시간 계산
        start_m = start_min % 60     # 분 계산
        end_h = end_min // 60        # 종료 시간 계산
        end_m = end_min % 60         # 종료 분 계산
        
        results.append({
            "title": row["title"],
            "predicted_priority": int(row["predicted_priority"]),  # AI 예측 우선순위
            "importance": int(row["importance"]),                   # 사용자 지정 중요도
            "start_time": f"{start_h:02}:{start_m:02}",            # HH:MM 형식
            "end_time": f"{end_h:02}:{end_m:02}",                  # HH:MM 형식
            "status": "배치 완료"
        })
        placement_success += 1
        print(f"  ✅ '{row['title']}' 배치 완료: {start_h:02}:{start_m:02}-{end_h:02}:{end_m:02}", file=sys.stderr)
        
    else:
        # ❌ 배치 실패: 시간 부족 또는 충돌로 인한 실패
        results.append({
            "title": row["title"],
            "predicted_priority": int(row["predicted_priority"]),
            "importance": int(row["importance"]),
            "start_time": None,
            "end_time": None,
            "status": "배치 실패",
            "reason": "시간 부족으로 배치 실패 - 다른 날짜를 고려해보세요"
        })
        print(f"  ❌ '{row['title']}' 배치 실패: 시간 부족", file=sys.stderr)

print(f"📊 배치 완료: {placement_success}/{len(df)}개 일정 성공", file=sys.stderr)

# 📤 8. Node.js 백엔드로 최종 결과 JSON 출력
print(json.dumps(results, ensure_ascii=False))
