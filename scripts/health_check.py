#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import sys
import time

def check_health(url, retries=3, delay=2):
    print(f"Checking health of {url}...")
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.getcode() == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    print(f"✅ Success! Application is {data.get('status', 'unknown')}.")
                    return True
                else:
                    print(f"⚠️ Warning: Received status code {response.getcode()}")
        except urllib.error.URLError as e:
            print(f"❌ Attempt {attempt}/{retries} failed: {e.reason}")
        except json.JSONDecodeError:
            print(f"❌ Attempt {attempt}/{retries} failed: Invalid JSON response")
        except Exception as e:
            print(f"❌ Attempt {attempt}/{retries} failed: {str(e)}")
            
        if attempt < retries:
            print(f"Retrying in {delay} seconds...")
            time.sleep(delay)
            
    print("❌ Application failed health check.")
    return False

if __name__ == "__main__":
    url = "http://localhost:5001/api/health"
    if len(sys.argv) > 1:
        url = sys.argv[1]
        
    if not check_health(url):
        sys.exit(1)
    sys.exit(0)
