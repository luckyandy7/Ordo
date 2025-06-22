/* ==================== MongoDB Playground 스크립트 ==================== */
/* MongoDB 데이터베이스 연습 및 테스트용 스크립트 파일 */

/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playbooks/

// ==================== 데이터베이스 선택 ====================
// 사용할 데이터베이스를 선택합니다 (테스트용 데이터베이스)
use('mongodbVSCodePlaygroundDB');

// ==================== 테스트 데이터 삽입 ====================
// sales 컬렉션에 여러 개의 판매 데이터 문서를 삽입합니다
db.getCollection('sales').insertMany([
  // 2014년 3월 1일 오전 8시 - abc 상품 판매
  { 'item': 'abc', 'price': 10, 'quantity': 2, 'date': new Date('2014-03-01T08:00:00Z') },
  
  // 2014년 3월 1일 오전 9시 - jkl 상품 판매
  { 'item': 'jkl', 'price': 20, 'quantity': 1, 'date': new Date('2014-03-01T09:00:00Z') },
  
  // 2014년 3월 15일 오전 9시 - xyz 상품 판매 (수량 10개)
  { 'item': 'xyz', 'price': 5, 'quantity': 10, 'date': new Date('2014-03-15T09:00:00Z') },
  
  // 2014년 4월 4일 오전 11시 21분 - xyz 상품 판매 (수량 20개)
  { 'item': 'xyz', 'price': 5, 'quantity': 20, 'date': new Date('2014-04-04T11:21:39.736Z') },
  
  // 2014년 4월 4일 오후 9시 23분 - abc 상품 판매 (수량 10개)
  { 'item': 'abc', 'price': 10, 'quantity': 10, 'date': new Date('2014-04-04T21:23:13.331Z') },
  
  // 2015년 6월 4일 오전 5시 8분 - def 상품 판매
  { 'item': 'def', 'price': 7.5, 'quantity': 5, 'date': new Date('2015-06-04T05:08:13Z') },
  
  // 2015년 9월 10일 오전 8시 43분 - def 상품 판매 (수량 10개)
  { 'item': 'def', 'price': 7.5, 'quantity': 10, 'date': new Date('2015-09-10T08:43:00Z') },
  
  // 2016년 2월 6일 오후 8시 20분 - abc 상품 판매
  { 'item': 'abc', 'price': 10, 'quantity': 5, 'date': new Date('2016-02-06T20:20:13Z') },
]);

// ==================== 특정 날짜 판매 조회 ====================
// 2014년 4월 4일에 발생한 판매 건수를 조회합니다
const salesOnApril4th = db.getCollection('sales').find({
  date: { 
    $gte: new Date('2014-04-04'),    // 2014년 4월 4일 이상
    $lt: new Date('2014-04-05')      // 2014년 4월 5일 미만
  }
}).count();

// ==================== 결과 출력 ====================
// 조회 결과를 출력창에 표시합니다
console.log(`${salesOnApril4th} sales occurred in 2014.`);

// ==================== 집계 파이프라인 실행 ====================
// 2014년 판매 데이터를 상품별로 그룹화하여 총 판매액을 계산합니다
// Use '.toArray()' to exhaust the cursor to return the whole result set.
// You can use '.hasNext()/.next()' to iterate through the cursor page by page.
db.getCollection('sales').aggregate([
  // 1단계: 2014년 판매 데이터만 필터링
  { $match: { date: { $gte: new Date('2014-01-01'), $lt: new Date('2015-01-01') } } },
  
  // 2단계: 상품별로 그룹화하고 총 판매액 계산 (가격 × 수량)
  { $group: { _id: '$item', totalSaleAmount: { $sum: { $multiply: [ '$price', '$quantity' ] } } } }
]);
