// ============================================
// 🌟 HORAE AI 스케줄 최적화 시스템
// ============================================
// OpenAI GPT-4를 활용한 지능형 일정 분석 및 최적화 엔진
// 시간의 여신 "호라이"가 사용자의 일정을 분석하여 개선점과 조언을 제공

const { OpenAI } = require('openai');    // OpenAI API 클라이언트
const dotenv = require('dotenv');        // 환경 변수 로더

// ============================================
// 🔧 환경 설정
// ============================================
// gpt.env 파일에서 OpenAI API 키 등 환경 변수 로드
dotenv.config({ path: './gpt.env' });

// 🤖 OpenAI 클라이언트 초기화 (GPT-4 모델 사용)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * ============================================
 * 🧠 Horae AI 핵심 스케줄 최적화 함수
 * ============================================
 * OpenAI GPT-4를 활용하여 사용자의 일정을 분석하고 최적화 조언을 제공
 * 
 * @param {Array} schedule - 분석할 일정 배열 (Event 객체들)
 * @param {string} mode - 분석 모드
 *   - "optimize": 일정 최적화 분석 (시간 충돌, 효율성 등)
 *   - "daily": 하루 전체에 대한 조언 및 격려
 *   - "suggestions": 일정 추가 추천 옵션들
 * @returns {Promise<Object|string>} AI가 생성한 최적화 피드백 또는 추천 옵션들
 */
async function optimizeSchedule(schedule, mode = "optimize") {
  // ============================================
  // 🔍 입력 데이터 검증
  // ============================================
  if (!Array.isArray(schedule)) {
    throw new Error("올바른 스케줄 데이터가 필요합니다.");
  }

  // 📭 빈 스케줄 처리 - 모드별 맞춤 응답
  if (schedule.length === 0) {
    if (mode === "suggestions") {
      return {
        type: "suggestions",
        options: [],
        message: "일정이 없어서 추천할 내용이 없습니다. 먼저 일정을 추가해주세요."
      };
    }
    return mode === "daily" 
      ? "오늘은 여유로운 하루네요. ✨ 새로운 시작을 위한 완벽한 날입니다. 소중한 일정을 추가해보시는 건 어떨까요? 오늘도 좋은 하루 되세요 😊"
      : "일정이 없어서 분석할 내용이 없습니다. 먼저 일정을 추가해주세요.";
  }

  // 🎯 추천 옵션 모드 - 별도 함수로 처리
  if (mode === "suggestions") {
    return generateScheduleSuggestions(schedule);
  }

  // ============================================
  // 📝 스케줄 포맷팅 - AI가 이해하기 쉬운 형태로 변환
  // ============================================
  const formatted = schedule.map((item, index) => {
    const title = item.title || "제목 없음";                          // 일정 제목
    const startTime = item.start_time || extractTime(item.startDate); // 시작 시간 추출
    const endTime = item.end_time || extractTime(item.endDate);       // 종료 시간 추출
    return `${index + 1}. ${startTime}-${endTime} ${title}`;
  }).join("\n");

  // ============================================
  // 🎨 AI 프롬프트 설계 - 모드별 맞춤 지시사항
  // ============================================
  const prompts = {
    // 📊 최적화 모드: 일정 분석 및 개선점 제시
    optimize: `당신은 시간의 여신 호라이입니다. 사용자의 일정을 분석하여 한국어로 간결한 조언을 제공하세요.

오늘의 일정:
${formatted}

요구사항:
- 시간 충돌, 비효율적인 순서, 휴식 부족 등의 문제점을 찾아주세요
- 구체적인 개선 방안을 제시하세요
- 반드시 한국어로 답변하세요
- 5문장 이내로 간결하게 작성하세요
- 존댓말(~세요)을 사용하세요
- 마지막에 "오늘도 좋은 하루 되세요 😊"로 끝내주세요`,

    // 💝 일일 조언 모드: 따뜻한 격려와 지혜
    daily: `당신은 시간의 여신 호라이입니다. 사용자의 하루를 위한 지혜로운 조언을 한국어로 제공하세요.

오늘의 일정:
${formatted}

요구사항:
- 오늘 하루에 대한 따뜻하고 지혜로운 조언을 해주세요
- 일정의 패턴을 보고 격려의 말을 전해주세요
- 반드시 한국어로 답변하세요
- 3-4문장으로 시적이고 우아하게 작성하세요
- 존댓말(~세요)을 사용하세요
- 마지막에 "오늘도 좋은 하루 되세요 😊"로 끝내주세요`
  };

  const prompt = prompts[mode] || prompts.optimize;

  console.log(`⏳ 호라이가 ${mode === 'daily' ? '하루의 지혜를' : '일정 최적화를'} 준비하고 있어요...`);

  try {
        // ============================================
        // 🤖 OpenAI API 호출 - GPT-4로 분석 수행
        // ============================================
        console.log("🔗 OpenAI API 호출 시작...");
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",           // GPT-4 최신 모델 사용
            messages: [
                {
                    role: "system",    // AI 역할 정의
                    content: "당신은 시간의 여신 호라이입니다. 사용자의 일정을 최적화하고 조언하는 AI 어시스턴트입니다."
                },
                {
                    role: "user",      // 사용자 요청 (분석할 일정 데이터)
                    content: prompt
                }
            ],
            temperature: 0.7,          // 창의성 수준 (0.0-1.0)
            max_tokens: 500,           // 최대 응답 길이
            top_p: 1,                  // 토큰 선택 다양성
            frequency_penalty: 0,      // 반복 단어 패널티
            presence_penalty: 0        // 새로운 주제 유도 패널티
    });

        console.log("✅ OpenAI API 응답 받음");
        console.log("📤 응답 내용:", completion.choices[0].message.content);
        
        // 🎯 AI 응답 결과 추출 및 정리
        let result = completion.choices[0].message.content?.trim() || "";
    
    // 📝 결과 정리 및 검증 (한국어 품질 개선)
    result = cleanupResponse(result, mode);
    
    console.log("✨ 호라이의 조언이 완성되었습니다!");
    console.log("🎯 최종 결과:", result);
    return result;

  } catch (err) {
    console.error("❌ 호라이 AI 연결 실패:", err.message);
    
    // 🛡️ API 실패 시 로컬 fallback 제공 (서비스 연속성 보장)
    return generateLocalFallback(schedule, mode);
  }
}

/**
 * ============================================
 * 🕐 시간 문자열 추출 헬퍼 함수
 * ============================================
 * 다양한 날짜 형식에서 시간(HH:MM) 정보를 추출
 * 
 * @param {string} dateString - ISO 날짜 문자열 또는 시간 문자열
 * @returns {string} "HH:MM" 형식의 시간 문자열
 */
function extractTime(dateString) {
  if (!dateString) return "시간미정";
  try {
    const date = new Date(dateString);
    // 한국 시간대 기준으로 24시간 형식 시간 추출
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return "시간미정";  // 파싱 실패 시 기본값
  }
}

/**
 * ============================================
 * 🧹 AI 응답 정리 및 검증 함수
 * ============================================
 * OpenAI 응답을 한국어 서비스에 적합하게 후처리
 * 
 * @param {string} response - OpenAI가 생성한 원본 응답
 * @param {string} mode - 응답 모드 (optimize/daily)
 * @returns {string} 정리된 한국어 응답
 */
function cleanupResponse(response, mode) {
  if (!response) {
    return generateLocalFallback([], mode);
  }

  // 🔤 영어 텍스트 제거 (한국어 서비스 일관성)
  response = response.replace(/[A-Za-z]{4,}/g, '');
  
  // 📝 불필요한 마크다운 문법 제거
  response = response.replace(/[#*`]/g, '');
  
  // 🔧 다중 공백 정리 (가독성 향상)
  response = response.replace(/\s+/g, ' ').trim();
  
  // 😊 마무리 인사 보장 (일관된 사용자 경험)
  if (!response.includes('😊')) {
    response += " 오늘도 좋은 하루 되세요 😊";
  }
  
  return response || generateLocalFallback([], mode);
}

/**
 * ============================================
 * 💡 일정 추천 옵션들 생성 함수
 * ============================================
 * 현재 일정을 분석하여 사용자에게 도움이 될 추가 일정들을 제안
 * 
 * @param {Array} schedule - 현재 일정 배열
 * @returns {Promise<Object>} 추천 옵션들과 설명이 포함된 객체
 */
async function generateScheduleSuggestions(schedule) {
  try {
    console.log("🎯 일정 추천 옵션 생성 시작...");
    console.log("📊 받은 일정 데이터:", JSON.stringify(schedule, null, 2));
    
    // GPT API를 통한 일정 분석 및 추천
    const formatted = schedule.map((item, index) => {
      const title = item.title || "제목 없음";
      const startTime = item.start_time || extractTime(item.startDate);
      const endTime = item.end_time || extractTime(item.endDate);
      return `${index + 1}. ${startTime}-${endTime} ${title}`;
    }).join("\n");

    console.log("📝 포맷된 일정:", formatted);

    const prompt = `당신은 시간의 여신 호라이입니다. 사용자의 일정을 분석하고 더 나은 일정 옵션들을 제안해주세요.

현재 일정:
${formatted}

요구사항:
1. 다음 세 가지 관점에서 일정을 최적화하여 제안해주세요:
   - 시간 효율성 (이동 시간, 시간 충돌 등)
   - 에너지 관리 (휴식, 집중 시간)
   - 우선순위 (중요도, 긴급도)

2. 각 제안에 대해 다음 정보를 포함해주세요:
   - 제안 이유
   - 기대 효과
   - 구체적인 시간 배치
   - 실행 난이도

3. JSON 형식으로 응답해주세요:
{
  "suggestions": [
    {
      "id": "시간 효율성",
      "title": "제목",
      "description": "설명",
      "schedule": [시간별 일정],
      "benefits": ["이점1", "이점2", "이점3"],
      "details": {
        "efficiency": "효율성 점수",
        "difficulty": "난이도",
        "timeRequired": "적용 소요 시간"
      },
      "tips": ["팁1", "팁2", "팁3"]
    },
    ...
  ]
}`;

    console.log("🚀 OpenAI API 호출 중...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "당신은 시간의 여신 호라이입니다. 사용자의 일정을 최적화하고 조언하는 AI 어시스턴트입니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    console.log("✅ OpenAI 응답 받음");
    let result = completion.choices[0].message.content?.trim() || "";
    console.log("📤 원본 응답:", result);
    
    // JSON 파싱 시도
    try {
      // JSON 시작과 끝 위치 찾기
      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}') + 1;
      
      console.log("🔍 JSON 위치:", {jsonStart, jsonEnd});
      
      // 📊 JSON 구조 유효성 검사 (안정성 보장)
      if (jsonStart === -1 || jsonEnd === 0) {
        console.error("❌ GPT 응답에서 JSON을 찾을 수 없음");
        console.log("🔄 로컬 추천으로 전환");
        return generateLocalSuggestions(schedule);
      }
      
      // 🎯 JSON 부분만 정확히 추출 (파싱 정확도 향상)
      const jsonStr = result.slice(jsonStart, jsonEnd);
      console.log("📄 추출된 JSON:", jsonStr);
      
      // 🔧 JSON 파싱 및 구조 검증
      const suggestions = JSON.parse(jsonStr);
      console.log("✅ JSON 파싱 성공:", suggestions);
      
      // ✅ 필수 필드 검증 (서비스 안정성 보장)
      if (!suggestions.suggestions || !Array.isArray(suggestions.suggestions)) {
        console.error("❌ GPT 응답의 JSON 구조가 올바르지 않음");
        console.log("🔄 로컬 추천으로 전환");
        return generateLocalSuggestions(schedule);
      }
      
      console.log("🎉 최종 추천 옵션 생성 완료!");
      return suggestions;
    } catch (err) {
      console.error("❌ GPT 응답 파싱 실패:", err);
      console.log("🔄 로컬 추천으로 전환");
      return generateLocalSuggestions(schedule);
    }

  } catch (err) {
    console.error("❌ 일정 추천 생성 실패:", err);
    console.log("🔄 로컬 추천으로 전환");
    return generateLocalSuggestions(schedule);
  }
}

/**
 * ============================================
 * 🏠 로컬 기반 기본 추천 생성 함수 (폴백용)
 * ============================================
 * OpenAI API 연결 실패 시 로컬 로직으로 일정 최적화 옵션 제공
 * 서비스 연속성을 보장하기 위한 백업 메커니즘
 * 
 * @param {Array} schedule - 분석할 일정 배열
 * @returns {Object} 로컬에서 생성한 추천 옵션들
 */
function generateLocalSuggestions(schedule) {
  console.log("🏠 로컬 추천 옵션 생성 중...");
  
  const suggestions = [];
  
  // 🕐 옵션 1: 시간 순서 정렬 (기본적인 효율성 보장)
  const timeOrderedSchedule = [...schedule].sort((a, b) => {
    const timeA = a.start_time || extractTime(a.startDate);
    const timeB = b.start_time || extractTime(b.startDate);
    return timeA.localeCompare(timeB);
  });
  
  // 📊 첫 번째 추천: 시간 순서 최적화 옵션
  suggestions.push({
    id: 'time-ordered',
    title: '⏰ 시간 순서 최적화',
    description: '일정을 시간 순서대로 정렬하여 효율성을 높입니다',
    schedule: timeOrderedSchedule,
    benefits: ['시간 충돌 방지', '논리적 순서', '스트레스 감소'],
    details: {
      efficiency: '90%',
      difficulty: '쉬움',
      timeRequired: '즉시 적용 가능'
    },
    tips: [
      '시간 순서대로 정렬된 일정은 이동 시간을 최소화합니다',
      '전체적인 일과를 한눈에 파악할 수 있습니다',
      '불필요한 시간 낭비를 줄일 수 있습니다'
    ]
  });

  // 🧠 두 번째 추천: 집중 시간대 최적화 옵션
  const focusOptimized = optimizeFocusTime(schedule);
  suggestions.push({
    id: 'focus-time',
    title: '🧠 집중력 최적화',
    description: '집중도가 높은 시간대에 중요한 일정을 배치합니다',
    schedule: focusOptimized,
    benefits: ['생산성 향상', '효율적 시간 활용', '에너지 절약'],
    details: {
      efficiency: '85%',
      difficulty: '보통',
      timeRequired: '5분 검토 필요'
    },
    tips: [
      '오전 시간대는 집중력이 가장 높습니다',
      '중요한 업무는 오전에 배치하세요',
      '오후엔 루틴한 작업을 배치하는 것이 좋습니다'
    ]
  });

  // ☕ 세 번째 추천: 휴식 시간 추가 옵션
  const withBreaks = addBreaksToSchedule(schedule);
  suggestions.push({
    id: 'with-breaks',
    title: '☕ 휴식 시간 추가',
    description: '일정 사이에 적절한 휴식 시간을 추가합니다',
    schedule: withBreaks,
    benefits: ['피로도 감소', '집중력 유지', '스트레스 완화'],
    details: {
      efficiency: '95%',
      difficulty: '쉬움',
      timeRequired: '즉시 적용 가능'
    },
    tips: [
      '15분의 짧은 휴식이 집중력을 회복시킵니다',
      '휴식 시간에는 스마트폰을 멀리 두세요',
      '가벼운 스트레칭이나 수분 섭취를 권합니다'
    ]
  });

  console.log(`✅ 로컬 추천 ${suggestions.length}개 옵션 생성 완료`);
  
  // 🎁 최종 추천 결과 패키징 (일관된 응답 형식)
  return { 
    type: "suggestions",
    options: suggestions,
    message: "호라이가 준비한 맞춤형 일정 최적화 옵션들입니다. 각 옵션을 살펴보시고 가장 적합한 방식을 선택해보세요! 🌟"
  };
}

/**
 * ============================================
 * 🧠 집중 시간대 최적화 함수
 * ============================================
 * 하루 중 집중도가 높은 시간대에 맞춰 일정을 재배치
 * 생산성 극대화를 위한 시간대별 가중치 적용
 * 
 * @param {Array} schedule - 최적화할 일정 배열
 * @returns {Array} 집중도 기반으로 재정렬된 일정 배열
 */
function optimizeFocusTime(schedule) {
  // ⏰ 시간대별 집중도 가중치 설정 (생체리듬 기반)
  const timeWeights = {
    morning: { start: "09:00", end: "12:00", weight: 1.0 },    // 오전: 최고 집중도
    afternoon: { start: "13:00", end: "16:00", weight: 0.8 },  // 오후: 보통 집중도
    evening: { start: "16:00", end: "18:00", weight: 0.6 }     // 저녁: 낮은 집중도
  };

  // 📊 일정별 집중도 가중치 계산 및 적용
  const weightedSchedule = schedule.map(item => {
    const startTime = extractTime(item.startDate);
    let weight = 0.5; // 기본 가중치 (시간대 미지정)

    // 🎯 시간대별 가중치 매칭 및 적용
    Object.values(timeWeights).forEach(period => {
      if (startTime >= period.start && startTime <= period.end) {
        weight = period.weight;
      }
  });

  // 📋 가중치 정보가 포함된 일정 객체 생성
  return {
      ...item,
      weight,
      originalStart: startTime
    };
  });

  // 🏆 가중치 기준 내림차순 정렬 (높은 집중도 우선)
  return weightedSchedule
    .sort((a, b) => b.weight - a.weight)
    .map(({ weight, originalStart, ...item }) => item);
}

/**
 * ============================================
 * ☕ 휴식 시간이 포함된 일정 생성 함수
 * ============================================
 * 연속된 일정 사이에 적절한 휴식 시간을 자동 삽입
 * 피로도 관리와 집중력 유지를 위한 웰빙 기능
 * 
 * @param {Array} schedule - 원본 일정 배열
 * @returns {Array} 휴식 시간이 추가된 새로운 일정 배열
 */
function addBreaksToSchedule(schedule) {
  // 📊 단일 일정의 경우 휴식 시간 불필요
  if (schedule.length <= 1) return schedule;
  
  const result = [];
  // ⏰ 시간 순서대로 일정 정렬 (휴식 시간 삽입을 위한 전처리)
  const sortedSchedule = [...schedule].sort((a, b) => {
    const timeA = a.start_time || extractTime(a.startDate);
    const timeB = b.start_time || extractTime(b.startDate);
    return timeA.localeCompare(timeB);
  });

  // 🔄 각 일정 사이에 휴식 시간 삽입 로직
  for (let i = 0; i < sortedSchedule.length; i++) {
    result.push(sortedSchedule[i]);
    
    // 🌟 마지막 일정이 아니라면 15분 휴식 시간 자동 추가
    if (i < sortedSchedule.length - 1) {
      const currentEnd = extractTime(sortedSchedule[i].endDate);
      const nextStart = extractTime(sortedSchedule[i + 1].startDate);
      
      // ☕ 휴식 시간 일정 객체 생성
      result.push({
        title: '휴식 시간',
        start_time: currentEnd,
        end_time: addMinutes(currentEnd, 15),  // 15분 휴식
        isBreak: true,              // 휴식 시간 식별 플래그
        color: '#E8F5E8'           // 연한 초록색 (편안함 표현)
      });
    }
  }
  
  return result;
}

/**
 * ============================================
 * 🎯 우선순위 기반 일정 정렬 함수
 * ============================================
 * 일정 제목의 키워드를 분석하여 중요도에 따라 자동 정렬
 * 효율적인 업무 처리 순서 제안을 위한 지능형 분류
 * 
 * @param {Array} schedule - 정렬할 일정 배열
 * @returns {Array} 우선순위에 따라 정렬된 일정 배열
 */
function organizePrioritySchedule(schedule) {
  // 📝 키워드 기반 우선순위 분류 체계
  const priorityKeywords = {
    high: ['회의', '미팅', '중요', '급함', '마감', '발표', '프레젠테이션'],    // 높은 우선순위
    medium: ['업무', '작업', '공부', '학습', '준비'],                        // 보통 우선순위
    low: ['휴식', '식사', '개인', '자유', '여가']                          // 낮은 우선순위
  };

  // 🏆 우선순위 점수 기준 내림차순 정렬 (높은 우선순위 먼저)
  return [...schedule].sort((a, b) => {
    const scoreA = calculatePriorityScore(a.title, priorityKeywords);
    const scoreB = calculatePriorityScore(b.title, priorityKeywords);
    return scoreB - scoreA;
  });
}

/**
 * ============================================
 * 🔢 우선순위 점수 계산 함수
 * ============================================
 * 일정 제목에서 키워드를 추출하여 중요도 점수 산출
 * 
 * @param {string} title - 분석할 일정 제목
 * @param {Object} keywords - 우선순위별 키워드 목록
 * @returns {number} 계산된 우선순위 점수 (1-3)
 */
function calculatePriorityScore(title, keywords) {
  if (!title) return 0;
  
  const lowerTitle = title.toLowerCase();
  
  // 🔴 높은 우선순위 키워드 검사
  for (const keyword of keywords.high) {
    if (lowerTitle.includes(keyword)) return 3;
  }
  // 🟡 보통 우선순위 키워드 검사
  for (const keyword of keywords.medium) {
    if (lowerTitle.includes(keyword)) return 2;
  }
  // 🟢 낮은 우선순위 키워드 검사
  for (const keyword of keywords.low) {
    if (lowerTitle.includes(keyword)) return 1;
  }
  
  return 2; // 기본 중간 우선순위 (키워드 매칭 실패 시)
}

/**
 * ============================================
 * ⏰ 시간 계산 헬퍼 함수
 * ============================================
 * 주어진 시간에 분을 추가하여 새로운 시간 반환
 * 
 * @param {string} timeString - "HH:MM" 형식의 시간 문자열
 * @param {number} minutes - 추가할 분 수
 * @returns {string} 계산된 새로운 시간 ("HH:MM" 형식)
 */
function addMinutes(timeString, minutes) {
  try {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;  // 24시간 형식 유지
    const newMins = totalMinutes % 60;
    
    // 📝 두 자리 수로 패딩하여 일관된 형식 보장
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  } catch {
    return timeString;  // 계산 실패 시 원본 반환
  }
}

/**
 * ============================================
 * 🛡️ 로컬 대체 응답 생성 함수 (최종 폴백)
 * ============================================
 * AI 서비스와 로컬 추천 모두 실패할 경우의 최후 방어선
 * 사용자에게 최소한의 긍정적 피드백 제공
 * 
 * @param {Array} schedule - 일정 배열 (사용되지 않음)
 * @param {string} mode - 응답 모드 ('optimize' 또는 'daily')
 * @returns {string} 모드에 맞는 격려 메시지
 */
function generateLocalFallback(schedule, mode) {
  // 📝 모드별 미리 준비된 격려 메시지 모음
  const responses = {
    optimize: [
      "일정들이 잘 정리되어 있네요. 중간중간 짧은 휴식을 취하시면 더욱 효율적일 것 같아요. 오늘도 좋은 하루 되세요 😊",
      "바쁜 하루가 예상됩니다. 각 일정 사이에 5-10분씩 여유를 두시면 좋을 것 같아요. 오늘도 좋은 하루 되세요 😊",
      "체계적으로 계획하셨네요. 중요한 일정부터 처리하시고, 틈틈이 수분 보충도 잊지 마세요. 오늘도 좋은 하루 되세요 😊"
    ],
    daily: [
      "오늘 하루도 의미있게 보내시길 바라요. ✨ 계획하신 일정들이 모두 순조롭게 진행되길 응원할게요. 오늘도 좋은 하루 되세요 😊",
      "새로운 하루의 시작이에요. 각 순간을 소중히 여기며 천천히 나아가세요. 오늘도 좋은 하루 되세요 😊",
      "균형잡힌 하루가 될 것 같아요. 일과 휴식의 조화 속에서 행복을 찾으시길 바라요. 오늘도 좋은 하루 되세요 😊"
    ]
  };

  const modeResponses = responses[mode] || responses.optimize;
  // 🎲 랜덤하게 메시지 선택하여 다양성 제공
  return modeResponses[Math.floor(Math.random() * modeResponses.length)];
}

// 📤 메인 함수 내보내기 (Node.js 모듈 시스템)
module.exports = optimizeSchedule;
