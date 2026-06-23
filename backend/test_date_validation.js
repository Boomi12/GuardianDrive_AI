import { isPastDate, isPastTimeToday } from './utils/timePlanner.js';

// Setup mock "current time" as 24-06-2026 01:20 AM
const mockNow = new Date(2026, 5, 24, 1, 20, 0, 0); // Month is 0-indexed, so 5 is June.

function runTests() {
  console.log('=== Running Time Validation Tests ===');
  console.log('Mock Current Time: 2026-06-24 at 01:20 AM\n');

  // Test Case 1: Today 06:00 AM → valid
  const todayDDMM = '24-06-2026';
  const todayYYYYMM = '2026-06-24';
  
  const case1_ddmm_pastDate = isPastDate(todayDDMM, mockNow);
  const case1_ddmm_pastTime = isPastTimeToday(todayDDMM, '06:00 AM', mockNow);
  const case1_ddmm_valid = !case1_ddmm_pastDate && !case1_ddmm_pastTime;
  
  console.log('Test 1 (Today 06:00 AM):');
  console.log('  DD-MM-YYYY format:', case1_ddmm_valid ? 'VALID (Pass)' : 'INVALID (Fail)');
  
  const case1_yyyymm_pastDate = isPastDate(todayYYYYMM, mockNow);
  const case1_yyyymm_pastTime = isPastTimeToday(todayYYYYMM, '06:00 AM', mockNow);
  const case1_yyyymm_valid = !case1_yyyymm_pastDate && !case1_yyyymm_pastTime;
  console.log('  YYYY-MM-DD format:', case1_yyyymm_valid ? 'VALID (Pass)' : 'INVALID (Fail)');

  // Test Case 2: Today 12:30 AM → invalid
  const case2_pastDate = isPastDate(todayYYYYMM, mockNow);
  const case2_pastTime = isPastTimeToday(todayYYYYMM, '12:30 AM', mockNow);
  const case2_valid = !case2_pastDate && !case2_pastTime;
  console.log('\nTest 2 (Today 12:30 AM):', !case2_valid ? 'INVALID (Pass)' : 'VALID (Fail)');

  // Test Case 3: Tomorrow 06:00 AM → valid
  const tomorrowYYYYMM = '2026-06-25';
  const case3_pastDate = isPastDate(tomorrowYYYYMM, mockNow);
  const case3_pastTime = isPastTimeToday(tomorrowYYYYMM, '06:00 AM', mockNow);
  const case3_valid = !case3_pastDate && !case3_pastTime;
  console.log('\nTest 3 (Tomorrow 06:00 AM):', case3_valid ? 'VALID (Pass)' : 'INVALID (Fail)');

  // Test Case 4: Yesterday any time → invalid
  const yesterdayYYYYMM = '2026-06-23';
  const case4_pastDate = isPastDate(yesterdayYYYYMM, mockNow);
  const case4_pastTime = isPastTimeToday(yesterdayYYYYMM, '09:00 PM', mockNow);
  const case4_valid = !case4_pastDate && !case4_pastTime;
  console.log('\nTest 4 (Yesterday 09:00 PM):', !case4_valid ? 'INVALID (Pass)' : 'VALID (Fail)');

  // Overall check
  const allPassed = case1_ddmm_valid && case1_yyyymm_valid && !case2_valid && case3_valid && !case4_valid;
  if (allPassed) {
    console.log('\n=== ALL DATE/TIME VALIDATION UNIT TESTS PASSED ===');
  } else {
    console.error('\n=== SOME VALIDATION TESTS FAILED ===');
    process.exit(1);
  }
}

runTests();
