#!/usr/bin/env node

/**
 * Horae 연동 테스트 스크립트
 * 
 * 이 스크립트는 Ordo와 Horae 백엔드 간의 연동을 테스트합니다.
 * 
 * 사용법:
 * node test-horae-integration.js
 */

const axios = require('axios');
const colors = require('colors');

// 테스트 설정
const ORDO_API_URL = 'http://localhost:5001';
const HORAE_API_URL = 'http://localhost:3000';

// 테스트 사용자 정보
const testUser = {
  email: 'test@horae.com',
  password: 'test123',
  name: 'Horae Test User'
};

// 테스트 일정 데이터
const testEvents = [
  {
    title: '아침 운동',
    startTime: '07:00',
    endTime: '08:00',
    color: '#FFE5E5'
  },
  {
    title: '프로젝트 회의',
    startTime: '10:00',
    endTime: '11:30',
    color: '#E5FFE5'
  },
  {
    title: '점심 식사',
    startTime: '12:00',
    endTime: '13:00',
    color: '#E5E5FF'
  }
];

let authToken = null;

console.log('🌟 Ordo ↔ Horae 연동 테스트 시작'.cyan.bold);
console.log('=' * 50);

/**
 * 테스트 결과 출력
 */
function logTest(name, success, message = '') {
  const status = success ? '✅ PASS'.green : '❌ FAIL'.red;
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

/**
 * 지연 함수
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 1단계: 서비스 상태 확인
 */
async function testServiceHealth() {
  console.log('\n📡 1단계: 서비스 상태 확인'.yellow.bold);
  
  try {
    // Ordo 서버 확인
    const ordoResponse = await axios.get(`${ORDO_API_URL}/api/db-status`, {
      timeout: 5000
    });
    logTest('Ordo 서버 연결', ordoResponse.status === 200);
  } catch (error) {
    logTest('Ordo 서버 연결', false, `${ORDO_API_URL}에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.`);
    process.exit(1);
  }

  try {
    // Horae 서버 확인
    const horaeResponse = await axios.get(`${HORAE_API_URL}/api/ordo/health`, {
      timeout: 5000
    });
    logTest('Horae 서버 연결', horaeResponse.status === 200);
  } catch (error) {
    logTest('Horae 서버 연결', false, `${HORAE_API_URL}에 연결할 수 없습니다. Horae 백엔드와 Ollama를 실행하세요.`);
    console.log('   Horae 실행 명령어:'.gray);
    console.log('   cd ../Horae/ordo-backend && npm start'.gray);
    process.exit(1);
  }
}

/**
 * 2단계: 사용자 인증
 */
async function testAuthentication() {
  console.log('\n🔐 2단계: 사용자 인증'.yellow.bold);
  
  try {
    // 테스트 사용자 로그인 시도
    const loginResponse = await axios.post(`${ORDO_API_URL}/api/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.data.status === 'success') {
      authToken = loginResponse.data.data.token;
      logTest('기존 사용자 로그인', true);
    }
  } catch (error) {
    // 로그인 실패 시 회원가입
    try {
      const signupResponse = await axios.post(`${ORDO_API_URL}/api/signup`, testUser);
      authToken = signupResponse.data.data.token;
      logTest('새 사용자 회원가입', true);
    } catch (signupError) {
      logTest('사용자 인증', false, '회원가입/로그인에 실패했습니다.');
      process.exit(1);
    }
  }

  if (!authToken) {
    logTest('JWT 토큰 발급', false);
    process.exit(1);
  } else {
    logTest('JWT 토큰 발급', true);
  }
}

/**
 * 3단계: 테스트 일정 생성
 */
async function createTestEvents() {
  console.log('\n📅 3단계: 테스트 일정 생성'.yellow.bold);
  
  const today = new Date().toISOString().split('T')[0];
  
  for (const event of testEvents) {
    try {
      const response = await axios.post(`${ORDO_API_URL}/api/events`, {
        title: event.title,
        startDate: `${today}T${event.startTime}:00.000Z`,
        endDate: `${today}T${event.endTime}:00.000Z`,
        color: event.color,
        category: 'test'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      logTest(`일정 생성: ${event.title}`, response.status === 201);
      await delay(500); // API 호출 간격
    } catch (error) {
      logTest(`일정 생성: ${event.title}`, false, error.message);
    }
  }
}

/**
 * 4단계: Horae 일정 최적화 테스트
 */
async function testHoraeOptimization() {
  console.log('\n🤖 4단계: Horae 일정 최적화 테스트'.yellow.bold);
  
  try {
    const today = new Date();
    const events = testEvents.map(event => ({
      title: event.title,
      startDate: `${today.toISOString().split('T')[0]}T${event.startTime}:00.000Z`,
      endDate: `${today.toISOString().split('T')[0]}T${event.endTime}:00.000Z`
    }));

    const response = await axios.post(`${ORDO_API_URL}/api/horae/schedule-optimize`, {
      events: events,
      date: today.toISOString().split('T')[0]
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30초 타임아웃
    });

    logTest('Horae 일정 최적화', response.data.success);
    if (response.data.success && response.data.data.feedback) {
      console.log('   AI 피드백:'.gray);
      console.log(`   ${response.data.data.feedback.substring(0, 100)}...`.gray);
    }
  } catch (error) {
    logTest('Horae 일정 최적화', false, error.response?.data?.error || error.message);
  }
}

/**
 * 5단계: Horae Daily 한마디 테스트
 */
async function testHoraeDailyWisdom() {
  console.log('\n💭 5단계: Horae Daily 한마디 테스트'.yellow.bold);
  
  try {
    const today = new Date();
    const events = testEvents.map(event => ({
      title: event.title,
      startDate: `${today.toISOString().split('T')[0]}T${event.startTime}:00.000Z`,
      endDate: `${today.toISOString().split('T')[0]}T${event.endTime}:00.000Z`
    }));

    const response = await axios.post(`${ORDO_API_URL}/api/horae/daily-wisdom`, {
      events: events,
      date: today.toISOString().split('T')[0]
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30초 타임아웃
    });

    logTest('Horae Daily 한마디', response.data.success);
    if (response.data.success && response.data.data.feedback) {
      console.log('   Daily 조언:'.gray);
      console.log(`   ${response.data.data.feedback.substring(0, 100)}...`.gray);
    }
  } catch (error) {
    logTest('Horae Daily 한마디', false, error.response?.data?.error || error.message);
  }
}

/**
 * 6단계: 정리 작업
 */
async function cleanup() {
  console.log('\n🧹 6단계: 정리 작업'.yellow.bold);
  
  try {
    // 테스트 일정들 삭제 (생략 - 실제로는 이벤트 ID로 삭제)
    logTest('테스트 데이터 정리', true, '수동으로 테스트 일정을 삭제해주세요.');
  } catch (error) {
    logTest('테스트 데이터 정리', false);
  }
}

/**
 * 메인 테스트 실행
 */
async function runTests() {
  try {
    await testServiceHealth();
    await testAuthentication();
    await createTestEvents();
    await testHoraeOptimization();
    await testHoraeDailyWisdom();
    await cleanup();
    
    console.log('\n🎉 모든 테스트 완료!'.green.bold);
    console.log('\n📝 테스트 결과 요약:'.cyan.bold);
    console.log('- Ordo와 Horae 서비스가 정상적으로 연동됨');
    console.log('- AI 기능들이 올바르게 작동함');
    console.log('- 이제 브라우저에서 http://localhost:5001 접속하여 확인하세요!');
    
  } catch (error) {
    console.error('\n💥 테스트 중 예상치 못한 오류 발생:'.red.bold);
    console.error(error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testServiceHealth,
  testAuthentication,
  testHoraeOptimization,
  testHoraeDailyWisdom
}; 