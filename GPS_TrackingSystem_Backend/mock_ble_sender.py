
#!/usr/bin/env python
"""
Mock BLE Sender - Simulates BLE tag detections from an ESP-32 device.
This script sends mock BLE tag detection data to the Django backend safety_app API.

Run this to test the BLE detection logging feature.
"""
import requests
import time
import datetime
import json

# Change this URL if your Django is on different port or path
URL = "http://127.0.0.1:8000/safety/api/ble-log/"

# Mock BLE tags (student/faculty tags)
tags = ["TAG-STUDENT-001", "TAG-STUDENT-002", "TAG-STUDENT-003", "TAG-FACULTY-001"]

print("=" * 60)
print("Mock BLE Sender Started")
print("=" * 60)
print(f"Sending BLE tag detections every 5 seconds...")
print(f"Target URL: {URL}")
print(f"Tags: {', '.join(tags)}")
print("=" * 60)
print()

iteration = 0
try:
    while True:
        iteration += 1
        print(f"\n[Iteration {iteration}] {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60)
        
        for tag in tags:
            # Simulate different RSSI (signal strength) values for different distances
            rssi = -45 - (tags.index(tag) * 10)
            
            data = {
                "tag_uuid": tag,
                "rssi": rssi,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            try:
                response = requests.post(URL, json=data, timeout=5)
                status_msg = f"✓ SUCCESS ({response.status_code})"
                if response.status_code not in [200, 201]:
                    status_msg = f"✗ FAILED ({response.status_code})"
                    print(f"  Response: {response.text}")
                
                print(f"  {tag:<25} | RSSI: {rssi:>3} dBm | {status_msg}")
                
            except requests.exceptions.ConnectionError:
                print(f"  {tag:<25} | RSSI: {rssi:>3} dBm | ✗ CONNECTION ERROR")
                print(f"    → Is Django server running on {URL}?")
            except requests.exceptions.Timeout:
                print(f"  {tag:<25} | RSSI: {rssi:>3} dBm | ✗ TIMEOUT")
            except Exception as e:
                print(f"  {tag:<25} | RSSI: {rssi:>3} dBm | ✗ ERROR: {str(e)}")
        
        print("-" * 60)
        print("Waiting 5 seconds before next iteration...")
        time.sleep(5)

except KeyboardInterrupt:
    print("\n" + "=" * 60)
    print("Mock BLE Sender Stopped (Ctrl+C pressed)")
    print("=" * 60)
