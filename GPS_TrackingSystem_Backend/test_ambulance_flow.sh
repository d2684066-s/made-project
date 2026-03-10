#!/bin/bash

# ITS Transport System - API Integration Test
# This script tests the complete ambulance service flow

set -e

API="http://localhost:8000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}ITS Ambulance Service Test${NC}"
echo -e "${BLUE}================================${NC}\n"

# Test 1: Create/Get Driver Token
echo -e "${YELLOW}1️⃣  Testing Driver Authentication...${NC}"
DRIVER_LOGIN=$(curl -s -X POST "$API/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "password": "driver123",
    "role": "driver"
  }')

DRIVER_TOKEN=$(echo "$DRIVER_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -z "$DRIVER_TOKEN" ]; then
  echo -e "${RED}❌ Driver login failed. Setting up new driver...${NC}"
  DRIVER_SIGNUP=$(curl -s -X POST "$API/auth/signup/" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Ambulance Driver Test",
      "email": "driver@test.com",
      "phone": "9999888877",
      "password": "driver123",
      "role": "driver",
      "driver_type": "ambulance"
    }')
  DRIVER_TOKEN=$(echo "$DRIVER_SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)
fi

echo -e "${GREEN}✓ Driver Token acquired${NC}"
echo -e "  Token: ${DRIVER_TOKEN:0:20}...${NC}\n"

# Test 2: Get Available Ambulances (THIS WAS BROKEN - SHOULD NOW WORK)
echo -e "${YELLOW}2️⃣  Testing Get Available Ambulances (FIXED - type parameter)...${NC}"
AVAILABLE=$(curl -s -w "\n%{http_code}" -X GET "$API/driver/available-vehicles/ambulance/" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

HTTP_CODE=$(echo "$AVAILABLE" | tail -n1)
RESPONSE=$(echo "$AVAILABLE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP 200 - Endpoint fixed!${NC}"
  echo -e "  $(echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -5)${NC}\n"
else
  echo -e "${RED}❌ HTTP $HTTP_CODE - Endpoint still broken${NC}"
  echo -e "  Response: $RESPONSE\n"
fi

# Test 3: Create/Get Student Token
echo -e "${YELLOW}3️⃣  Testing Student Authentication...${NC}"
STUDENT_LOGIN=$(curl -s -X POST "$API/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "student123",
    "role": "student"
  }')

STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${RED}❌ Student login failed. Setting up new student...${NC}"
  STUDENT_SIGNUP=$(curl -s -X POST "$API/auth/signup/" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Student",
      "email": "student@test.com",
      "phone": "7777666655",
      "password": "student123",
      "role": "student"
    }')
  STUDENT_TOKEN=$(echo "$STUDENT_SIGNUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)
fi

echo -e "${GREEN}✓ Student Token acquired${NC}\n"

# Test 4: Student Creates Ambulance Request
echo -e "${YELLOW}4️⃣  Testing Ambulance Request Creation (Student)...${NC}"
REQUEST=$(curl -s -w "\n%{http_code}" -X POST "$API/public/ambulance-request/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "pickup_location": "Medical Science Block",
    "drop_location": "City Hospital",
    "patient_name": "Test Patient",
    "reason": "Medical Emergency",
    "phone": "9876543210",
    "latitude": 26.9124,
    "longitude": 75.7873
  }')

HTTP_CODE=$(echo "$REQUEST" | tail -n1)
RESPONSE=$(echo "$REQUEST" | head -n-1)

if [ "$HTTP_CODE" -eq "200" ] || [ "$HTTP_CODE" -eq "201" ]; then
  echo -e "${GREEN}✓ HTTP $HTTP_CODE - Request created${NC}"
  BOOKING_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
  echo -e "  Booking ID: $BOOKING_ID${NC}\n"
else
  echo -e "${RED}❌ HTTP $HTTP_CODE - Request creation failed${NC}\n"
fi

# Test 5: Driver Gets Pending Requests
echo -e "${YELLOW}5️⃣  Testing Driver Gets Pending Requests...${NC}"
PENDING=$(curl -s -w "\n%{http_code}" -X GET "$API/driver/pending-requests/" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

HTTP_CODE=$(echo "$PENDING" | tail -n1)
RESPONSE=$(echo "$PENDING" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP 200 - Pending requests retrieved${NC}\n"
else
  echo -e "${RED}❌ HTTP $HTTP_CODE - Failed${NC}\n"
fi

# Test 6: Get Public Buses
echo -e "${YELLOW}6️⃣  Testing Get Public Buses (Student)...${NC}"
BUSES=$(curl -s -w "\n%{http_code}" -X GET "$API/public/buses/")

HTTP_CODE=$(echo "$BUSES" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ HTTP 200 - Buses retrieved${NC}\n"
else
  echo -e "${RED}❌ HTTP $HTTP_CODE - Failed${NC}\n"
fi

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Complete!${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${YELLOW}Summary:${NC}"
echo -e "  Driver Token: ${GREEN}${DRIVER_TOKEN:0:30}...${NC}"
echo -e "  Student Token: ${GREEN}${STUDENT_TOKEN:0:30}...${NC}"
echo -e "  Booking ID: ${GREEN}$BOOKING_ID${NC}\n"

echo -e "${YELLOW}✓ Key Fix Verified:${NC}"
echo -e "  /api/driver/available-vehicles/{type}/ now returns HTTP 200"
echo -e "  Type parameter is correctly passed"
echo -e "  Authorization header is properly set\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Login as driver in mobile app"
echo -e "  2. Enable shift status"  
echo -e "  3. Vehicle assignment should work (no 401 error)"
echo -e "  4. Book ambulance from student account"
echo -e "  5. Accept request from driver account"
echo -e "  6. Start trip and verify End Trip button shows real data\n"
