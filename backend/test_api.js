const BASE_URL = 'http://localhost:5000/api';
const tripId = 'TEST_TRIP_' + Math.random().toString(36).substring(2, 7).toUpperCase();

async function runTests() {
  console.log('=== GuardianDrive AI API Integration Test ===');
  console.log('Testing with tripId:', tripId);

  try {
    // 1. Test POST /api/itinerary/generate
    console.log('\n1. Testing POST /api/itinerary/generate...');
    const itinRes = await fetch(`${BASE_URL}/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId,
        source: 'Bangalore',
        destination: 'Mysore',
        tripType: 'Family',
        foodPreference: 'Any',
        budget: 'Medium',
        vehicleType: 'EV',
        tripDate: '2026-07-20',
        startTime: '09:00 AM',
        fuelOrBatteryLevel: 85,
        mileageOrRange: 340
      })
    });
    console.log('STATUS:', itinRes.status);
    const itinData = await itinRes.json();
    console.log('Success:', itinData.success);
    console.log('Itinerary Details:', {
      source: itinData.data.source,
      destination: itinData.data.destination,
      timelineEventsCount: itinData.data.timeline.length
    });

    // 2. Test POST /api/places/recommend
    console.log('\n2. Testing POST /api/places/recommend...');
    const placesRes = await fetch(`${BASE_URL}/places/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId,
        destination: 'Mysore',
        foodPreference: 'Any',
        budget: 'Medium',
        vehicleType: 'EV'
      })
    });
    console.log('STATUS:', placesRes.status);
    const placesData = await placesRes.json();
    console.log('Success:', placesData.success);
    console.log('Attractions Recommended:', placesData.data.attractions.map(a => a.name));

    // 3. Test GET /api/twin/:tripId
    console.log('\n3. Testing GET /api/twin/:tripId...');
    const getTwinRes = await fetch(`${BASE_URL}/twin/${tripId}`);
    console.log('STATUS:', getTwinRes.status);
    const getTwinData = await getTwinRes.json();
    console.log('Success:', getTwinData.success);
    console.log('Driver Twin Fatigue (Initial):', getTwinData.data.driverTwin.fatigueLevel);
    console.log('Vehicle Twin Fuel/Battery Level (Initial):', getTwinData.data.vehicleTwin.fuelOrBatteryLevel);

    // 4. Test POST /api/twin/update (Simulate Driver Fatigue)
    console.log('\n4. Testing POST /api/twin/update (Fatigue simulation)...');
    const updateRes = await fetch(`${BASE_URL}/twin/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId,
        driverTwin: { fatigueLevel: 85, distractionStatus: 'distracted', breakNeeded: true }
      })
    });
    console.log('STATUS:', updateRes.status);
    const updateData = await updateRes.json();
    console.log('Success:', updateData.success);
    console.log('Driver Twin Fatigue (Updated):', updateData.data.twin.driverTwin.fatigueLevel);
    console.log('Safety Agent Decision:', updateData.data.agents.safetyAgent);

    // 5. Test POST /api/agents/recommend
    console.log('\n5. Testing POST /api/agents/recommend...');
    const agentRes = await fetch(`${BASE_URL}/agents/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId })
    });
    console.log('STATUS:', agentRes.status);
    const agentData = await agentRes.json();
    console.log('Success:', agentData.success);
    console.log('Safety Agent status in record:', agentData.data.safetyAgent.status);
    console.log('Safety Agent recommendation:', agentData.data.safetyAgent.recommendation);

    // 6. Test past date rejection
    console.log('\n6. Testing POST /api/itinerary/generate with past date (expected rejection)...');
    const pastRes = await fetch(`${BASE_URL}/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'PAST_TRIP_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        source: 'Bangalore',
        destination: 'Mysore',
        tripType: 'Family',
        foodPreference: 'Any',
        budget: 'Medium',
        vehicleType: 'EV',
        tripDate: '2020-01-01',
        startTime: '09:00 AM'
      })
    });
    console.log('STATUS:', pastRes.status);
    const pastData = await pastRes.json();
    console.log('Success:', pastData.success || false);
    console.log('Reason:', pastData.reason);
    console.log('Message:', pastData.message);
    if (pastRes.status === 400 && pastData.reason === 'PAST_DATE') {
      console.log('✓ Rejection test passed!');
    } else {
      throw new Error('Server did not strictly reject past date!');
    }

    // 7. Test Vehicle Intelligence Endpoints
    console.log('\n7. Testing POST /api/vehicle/calculate-range (EV)...');
    const vehicleRangeRes = await fetch(`${BASE_URL}/vehicle/calculate-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleType: 'EV',
        tripDistance: 120,
        batteryPercentage: 80,
        batteryCapacity: 60,
        vehicleEfficiency: 5.5,
        tripId
      })
    });
    console.log('STATUS:', vehicleRangeRes.status);
    const vehicleRangeData = await vehicleRangeRes.json();
    console.log('Success:', vehicleRangeData.success);
    console.log('Estimated Range:', vehicleRangeData.data.estimatedRange);
    console.log('Is Trip Possible:', vehicleRangeData.data.isTripPossible);
    console.log('Stops Required:', vehicleRangeData.data.stopsRequired);

    console.log('\n8. Testing POST /api/vehicle/battery-health...');
    const batteryHealthRes = await fetch(`${BASE_URL}/vehicle/battery-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batteryPercentage: 80,
        usagePattern: 'Normal',
        rangeEfficiency: 5.5,
        chargingNeed: 'Balanced'
      })
    });
    console.log('STATUS:', batteryHealthRes.status);
    const batteryHealthData = await batteryHealthRes.json();
    console.log('Success:', batteryHealthData.success);
    console.log('Battery Health Score:', batteryHealthData.data.batteryHealthScore);
    console.log('Battery Health Status:', batteryHealthData.data.batteryHealthStatus);

    console.log('\n9. Testing POST /api/vehicle/mileage...');
    const mileageRes = await fetch(`${BASE_URL}/vehicle/mileage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleType: 'Petrol',
        mileage: 15
      })
    });
    console.log('STATUS:', mileageRes.status);
    const mileageData = await mileageRes.json();
    console.log('Success:', mileageData.success);
    console.log('Mileage Performance:', mileageData.data.mileagePerformance);
    console.log('Suggestions Count:', mileageData.data.mileageSuggestions.length);

    console.log('\n10. Testing POST /api/vehicle/stop-suggestions (Stops needed)...');
    const stopsRes = await fetch(`${BASE_URL}/vehicle/stop-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleType: 'EV',
        tripDistance: 500,
        estimatedRange: 200
      })
    });
    console.log('STATUS:', stopsRes.status);
    const stopsData = await stopsRes.json();
    console.log('Success:', stopsData.success);
    console.log('Stops Suggested:', stopsData.data.suggestedStops.map(s => `${s.name} at ${s.distance}km`));

    console.log('\n=== ALL API ENDPOINT CHECKS PASSED ===');
  } catch (error) {
    console.error('API Verification failed:', error.message);
    process.exit(1);
  }
}

runTests();
