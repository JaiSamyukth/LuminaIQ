import time
import requests
import datetime

# CONFIGURATION
URL_TO_PING = "https://luminaiq-api.onrender.com/health"
INTERVAL_SECONDS = 600  # 10 minutes (Render sleeps after 15 mins)

def ping_server():
    try:
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{current_time}] Pinging {URL_TO_PING}...")
        
        response = requests.get(URL_TO_PING)
        
        if response.status_code == 200:
            print(f"✅ Success! Server is awake. Status: {response.status_code}")
        else:
            print(f"⚠️ Warning: Received status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error pinging server: {str(e)}")

if __name__ == "__main__":
    print(f"🤖 Uptime Bot Started!")
    print(f"🎯 Target: {URL_TO_PING}")
    print(f"⏱️ Interval: {INTERVAL_SECONDS/60} minutes")
    print("-" * 40)
    
    # Initial ping
    ping_server()
    
    while True:
        time.sleep(INTERVAL_SECONDS)
        ping_server()
