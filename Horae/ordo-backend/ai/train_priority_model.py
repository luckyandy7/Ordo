"""
============================================
🤖 HORAE AI 우선순위 예측 모델 훈련 스크립트
============================================

📋 목적: 사용자 일정 데이터 학습을 통한 우선순위 예측 모델 생성
🎯 기능:
  - Random Forest 기반 분류 모델 훈련
  - 일정 특성별 중요도 학습
  - 모델 성능 검증 및 저장

🔧 사용 알고리즘: Random Forest Classifier
  - 이유: 과적합 방지, 특성 중요도 해석 가능, 안정적 성능

📊 입력 특성:
  - duration: 소요 시간(분)
  - importance: 사용자 지정 중요도(1-5)
  - flexible: 시간 유연성 여부(0/1)
  - start_hour: 선호 시작 시간

작성일: 2024년
작성자: HORAE 개발팀
버전: 1.0
"""

# 📦 필수 라이브러리 import
import pandas as pd                                    # 데이터 처리
from sklearn.ensemble import RandomForestClassifier    # 랜덤 포레스트 모델
from sklearn.model_selection import train_test_split   # 데이터 분할
from sklearn.metrics import classification_report      # 모델 성능 평가
import pickle                                         # 모델 저장/로드

print("🚀 HORAE AI 우선순위 예측 모델 훈련 시작...")

# 📊 1. 훈련 데이터 로드 (CSV 파일에서 일정 패턴 학습)
try:
    df = pd.read_csv("data/schedule_train.csv")
    print(f"✅ 훈련 데이터 로드 완료: {len(df)}개 샘플")
    print(f"📋 데이터 컬럼: {list(df.columns)}")
except FileNotFoundError:
    print("❌ 훈련 데이터 파일을 찾을 수 없습니다: data/schedule_train.csv")
    exit(1)

# 🔧 2. 특성 엔지니어링 및 데이터 전처리
X = df[["duration", "importance", "flexible", "start_hour"]].copy()
X["flexible"] = X["flexible"].astype(int)  # Boolean → int 변환 (모델 호환성)
y = df["priority"]  # 타겟 변수: 우선순위 레벨

print("🔧 특성 전처리 완료")
print(f"📊 특성 수: {X.shape[1]}, 샘플 수: {X.shape[0]}")

# 📊 3. 훈련/테스트 데이터 분리 (80:20 비율, 재현가능성 보장)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"🎯 데이터 분할 완료 - 훈련: {len(X_train)}개, 테스트: {len(X_test)}개")

# 🤖 4. Random Forest 모델 훈련 (앙상블 학습으로 안정성 확보)
print("🌳 Random Forest 모델 훈련 중...")
model = RandomForestClassifier(
    n_estimators=100,    # 트리 개수 (성능과 속도의 균형)
    random_state=42,     # 재현가능성 보장
    max_depth=10,        # 과적합 방지
    min_samples_split=5  # 최소 분할 샘플 수
)
model.fit(X_train, y_train)

# 📈 5. 모델 성능 평가
y_pred = model.predict(X_test)
accuracy = model.score(X_test, y_test)
print(f"🎯 모델 정확도: {accuracy:.3f}")
print("\n📊 상세 성능 리포트:")
print(classification_report(y_test, y_pred))

# 🔍 특성 중요도 분석
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n🔍 특성 중요도 순위:")
for _, row in feature_importance.iterrows():
    print(f"  {row['feature']}: {row['importance']:.3f}")

# 💾 6. 훈련된 모델 저장 (pickle 형식으로 직렬화)
try:
    with open("priority_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("\n✅ 모델 훈련 및 저장 완료: priority_model.pkl")
    print("🚀 모델이 HORAE AI 시스템에서 사용할 준비가 되었습니다!")
except Exception as e:
    print(f"❌ 모델 저장 실패: {e}")
    exit(1)
