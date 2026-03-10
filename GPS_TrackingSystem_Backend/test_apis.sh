#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8000/api"
DRIVER_ID=""
DRIVER_TOKEN=""
STUDENT_ID=""
STUDENT_TOKEN=""
AMBULANCE_ID=""
BUS_ID=""

echo -e "${BLUE}====== ITS TRANSPORT SYSTEM - API TEST SUITE ======${NC}\n"

# Test 1: Create Driver User
echo -e "${YELLOW}[1] Creating Driver User...${NC}"
DRIVER_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ambulance Driver",
    "email": "ambulance_driver@test.com",
    "phone": "9876543210",
    "password": "TestPass123!",
    "role": "driver",
    "driver_type": "ambulance"
  }')

echo $DRIVER_RESPONSE | python3 -m json.tool 2>/dev/null || echo $DRIVER_RESPONSE

DRIVER_TOKEN=$(echo $DRIVER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
if [ -z "$DRIVER_TOKEN" ]; then
  echo -e "${RED}Failed to create driver. Trying login instead...${NC}"
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "ambulance_driver@test.com",
      "password": "TestPass123!",
      "role": "driver"
    }')
  DRIVER_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
fi
echo -e "${GREEN}Driver Token: $DRIVER_TOKEN${NC}\n"

# Test 2: Create Student User
echo -e "${YELLOW}[2] Creating Student User...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "student@test.com",
    "phone": "9111111111",
    "password": "TestPass123!",
    "role": "student"
  }')

STUDENT_TOKEN=$(echo $STUDENT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
if [ -z "$STUDENT_TOKEN" ]; then
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "student@test.com",
      "password": "TestPass123!",
      "role": "student"
    }')
  STUDENT_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
fi
echo -e "${GREEN}Student Token: $STUDENT_TOKEN${NC}\n"

# Test 3: Create Ambulance Vehicle
echo -e "${YELLOW}[3] Creating Ambulance Vehicle...${NC}"
AMBULANCE_RESPONSE=$(curl -s -X POST "$API_URL/driver/available-vehicles/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "vehicle_type": "ambulance",
    "vehicle_number": "AMB001",
    "registration_number": "RJ01AB1234"
  }')

echo $AMBULANCE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $AMBULANCE_RESPONSE
AMBULANCE_ID=$(echo $AMBULANCE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
echo -e "${GREEN}Ambulance ID: $AMBULANCE_ID${NC}\n"

# Test 4: Get Available Ambulances (Fixed - passing correct type parameter)
echo -e "${YELLOW}[4] Getting Available Ambulances (with type parameter)...${NC}"
VEHICLES_RESPONSE=$(curl -s -X GET "$API_URL/driver/available-vehicles/ambulance/" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

echo $VEHICLES_RESPONSE | python3 -m json.tool 2>/dev/null || echo $VEHICLES_RESPONSE
echo -e "${GREEN}✓ Available ambulances endpoint working${NC}\n"

# Test 5: Assign Ambulance to Driver
echo -e "${YELLOW}[5] Assigning Ambulance to Driver...${NC}"
if [ ! -z "$AMBULANCE_ID" ]; then
  ASSIGN_RESPONSE=$(curl -s -X POST "$API_URL/driver/assign-vehicle/$AMBULANCE_ID/" \
    -H "Authorization: Bearer $DRIVER_TOKEN")
  
  echo $ASSIGN_RESPONSE | python3 -m json.tool 2>/dev/null || echo $ASSIGN_RESPONSE
  echo -e "${GREEN}✓ Vehicle assignment working${NC}\n"
fi

# Test 6: Create Ambulance Booking Request (from Student side)
echo -e "${YELLOW}[6] Student Creating Ambulance Service Request...${NC}"
BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/public/ambulance-request/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "pickup_location": "Medical Science Hostel",
    "drop_location": "District Hospital",
    "patient_name": "Test Patient",
    "reason": "Medical Emergency",
    "phone": "9876543210",
    "latitude": 26.9124,
    "longitude": 75.7873
  }')

echo $BOOKING_RESPONSE | python3 -m json.tool 2>/dev/null || echo $BOOKING_RESPONSE
BOOKING_ID=$(echo $BOOKING_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
echo -e "${GREEN}Booking ID: $BOOKING_ID${NC}\n"

# Test 7: Driver Gets Pending Ambulance Requests
echo -e "${YELLOW}[7] Driver Getting Pending Requests...${NC}"
PENDING=$(curl -s -X GET "$API_URL/driver/pending-requests/" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

echo $PENDING | python3 -m json.tool 2>/dev/null || echo $PENDING
echo -e "${GREEN}✓ Pending requests endpoint working${NC}\n"

# Test 8: Start Trip
echo -e "${YELLOW}[8] Driver Starting Trip...${NC}"
if [ ! -z "$AMBULANCE_ID" ]; then
  TRIP_RESPONSE=$(curl -s -X POST "$API_URL/driver/trips/start/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DRIVER_TOKEN" \
    -d "{
      \"vehicle_id\": \"$AMBULANCE_ID\"
    }")
  
  echo $TRIP_RESPONSE | python3 -m json.tool 2>/dev/null || echo $TRIP_RESPONSE
  TRIP_ID=$(echo $TRIP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
  echo -e "${GREEN}Trip ID: $TRIP_ID${NC}\n"
fi

# Test 9: Get Active Trip
echo -e "${YELLOW}[9] Getting Active Trip...${NC}"
ACTIVE_TRIP=$(curl -s -X GET "$API_URL/driver/active-trip/" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

echo $ACTIVE_TRIP | python3 -m json.tool 2>/dev/null || echo $ACTIVE_TRIP
echo -e "${GREEN}✓ Active trip endpoint working${NC}\n"

# Test 10: End Trip
echo -e "${YELLOW}[10] Ending Trip...${NC}"
if [ ! -z "$TRIP_ID" ]; then
  END_RESPONSE=$(curl -s -X POST "$API_URL/driver/trips/$TRIP_ID/end/" \
    -H "Authorization: Bearer $DRIVER_TOKEN")
  
  echo $END_RESPONSE | python3 -m json.tool 2>/dev/null || echo $END_RESPONSE
  echo -e "${GREEN}✓ End trip endpoint working${NC}\n"
fi

# Test 11: Send GPS Location
echo -e "${YELLOW}[11] Sending GPS Location Update...${NC}"
GPS_RESPONSE=$(curl -s -X POST "$API_URL/gps/receive/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "latitude": 26.9124,
    "longitude": 75.7873,
    "vehicle_id": "'$AMBULANCE_ID'"
  }')

echo $GPS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $GPS_RESPONSE
echo -e "${GREEN}✓ GPS location endpoint working${NC}\n"

echo -e "${BLUE}====== TEST SUITE COMPLETE ======${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "Driver Token: ${GREEN}$DRIVER_TOKEN${NC}"
echo -e "Student Token: ${GREEN}$STUDENT_TOKEN${NC}"
echo -e "Ambulance ID: ${GREEN}$AMBULANCE_ID${NC}"
echo -e "Booking ID: ${GREEN}$BOOKING_ID${NC}"
echo -e "Trip ID: ${GREEN}$TRIP_ID${NC}"
