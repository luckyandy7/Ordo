/**
 * ============================================
 * 🧪 HORAE AI 일정 최적화 테스트 스크립트
 * ============================================
 * 
 * 📋 목적: optimizeSchedule 함수의 정상 작동 여부 검증
 * 🎯 기능: 샘플 일정 데이터를 사용한 AI 응답 테스트
 * 🔧 용도: 개발 중 AI 엔진 품질 확인 및 디버깅
 * 
 * 작성일: 2024년
 * 작성자: HORAE 개발팀
 * 버전: 1.0
 */

// 📦 HORAE AI 최적화 엔진 모듈 import
const optimizeSchedule = require("./optimizeSchedule");

// 🗓️ 테스트용 샘플 일정 데이터 (실제 사용자 패턴 반영)
const schedule = [
  { start_time: "07:00", end_time: "08:00", title: "아침 운동" },        // 건강 관리
  { start_time: "09:00", end_time: "10:30", title: "팀 회의" },          // 업무 미팅
  { start_time: "11:00", end_time: "13:00", title: "코딩 작업" },        // 집중 업무
  { start_time: "14:00", end_time: "17:00", title: "논문 작성" }         // 창작 활동
];

// 🚀 비동기 테스트 실행 함수
(async () => {
  console.log("🎯 HORAE AI 일정 최적화 테스트 시작...");
  console.log("📊 테스트 일정:", JSON.stringify(schedule, null, 2));
  
  try {
    // 🤖 AI 최적화 엔진 호출
    const result = await optimizeSchedule(schedule);
    
    console.log("✅ AI 응답 성공!");
    console.log("📤 최적화 결과:", result);
    
    // 💾 필요 시 결과를 파일로 저장 (개발용)
    // const fs = require('fs');
    // fs.writeFileSync("test_output.txt", JSON.stringify(result, null, 2));
    // console.log("💾 결과가 test_output.txt에 저장되었습니다.");
    
  } catch (error) {
    console.error("❌ 테스트 실패:", error.message);
    console.error("🔍 상세 오류:", error);
  }
  
  console.log("🏁 테스트 완료");
})();
