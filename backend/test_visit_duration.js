import { getPlaceTimeStatus } from './utils/timePlanner.js';

function runTests() {
  console.log('=== Running Visit Duration Status Tests ===');
  
  // Mysore Palace closes at 5:30 PM.
  // minDuration: 60 mins, recommended duration: 120 mins.
  // 1. Arrival at 04:15 PM.
  // Close is 05:30 PM (330 mins - 255 mins = 75 mins available).
  // 75 mins is >= 60 (minDuration) but < 120 (recommended).
  // Status should be LIMITED.
  const status1 = getPlaceTimeStatus('Mysore Palace', '04:15 PM');
  console.log('Test 1 (Arrival at 04:15 PM):', status1 === 'LIMITED' ? 'PASS (LIMITED)' : `FAIL (${status1})`);

  // 2. Arrival at 05:15 PM.
  // Close is 05:30 PM (330 mins - 315 mins = 15 mins available).
  // 15 mins is < 60 (minDuration).
  // Status should be NOT ENOUGH TIME.
  const status2 = getPlaceTimeStatus('Mysore Palace', '05:15 PM');
  console.log('Test 2 (Arrival at 05:15 PM):', status2 === 'NOT ENOUGH TIME' ? 'PASS (NOT ENOUGH TIME)' : `FAIL (${status2})`);

  // 3. Arrival at 03:00 PM.
  // 150 mins available. Status should be OPEN.
  const status3 = getPlaceTimeStatus('Mysore Palace', '03:00 PM');
  console.log('Test 3 (Arrival at 03:00 PM):', status3 === 'OPEN' ? 'PASS (OPEN)' : `FAIL (${status3})`);

  // 4. Arrival at 06:00 PM.
  // Status should be CLOSED.
  const status4 = getPlaceTimeStatus('Mysore Palace', '06:00 PM');
  console.log('Test 4 (Arrival at 06:00 PM):', status4 === 'CLOSED' ? 'PASS (CLOSED)' : `FAIL (${status4})`);

  const allPassed = status1 === 'LIMITED' && status2 === 'NOT ENOUGH TIME' && status3 === 'OPEN' && status4 === 'CLOSED';
  if (allPassed) {
    console.log('\n=== ALL VISIT DURATION TESTS PASSED ===');
  } else {
    console.error('\n=== SOME VISIT DURATION TESTS FAILED ===');
    process.exit(1);
  }
}

runTests();
