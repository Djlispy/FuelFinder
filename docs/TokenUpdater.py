# ✅ Install dependencies
# !apt-get update -qq
# !apt-get install -y unzip xvfb libxi6 libgconf-2-4 > /dev/null
# !pip install -U selenium pyvirtualdisplay pynacl requests > /dev/null

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from pyvirtualdisplay import Display
import json, time, base64, requests
from nacl import public
import os

# ✅ Start headless display
display = Display(visible=0, size=(1920, 1080))
display.start()

# ✅ Chrome options
options = Options()
options.add_argument('--headless=new')  # new headless mode
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.add_argument('--window-size=1920,1080')
options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

# Launch Chrome
driver = webdriver.Chrome(options=options)

# Go to 7-Eleven locator page
driver.get("https://www.7-eleven.com/locator")
time.sleep(3)

# Extract Bearer token from performance logs
logs = driver.get_log("performance")
auth_token = None
for entry in logs:
    try:
        msg = json.loads(entry["message"])["message"]
        if msg.get("method") == "Network.requestWillBeSent":
            req = msg["params"]["request"]
            headers = req.get("headers", {})
            auth = headers.get("authorization") or headers.get("Authorization")
            if "graphql" in req.get("url", "") and auth and auth.startswith("Bearer "):
                auth_token = auth
                break
    except Exception:
        continue

driver.quit()
display.stop()

if auth_token:
    print("✅ Bearer token found:\n", auth_token)
    
    GITHUB_PAT = os.getenv("PERSONAL_ACCESS_TOKEN")
    if not GITHUB_PAT:
        print("❌ Missing GITHUB_PAT environment variable.")
        exit(1)

    REPO = "Djlispy/FuelFinder"
    SECRET_NAME = "AUTH_TOKEN"

    headers = {
        "Authorization": f"Bearer {GITHUB_PAT}",
        "Accept": "application/vnd.github+json"
    }

    r = requests.get(f"https://api.github.com/repos/{REPO}/actions/secrets/public-key", headers=headers)
    r.raise_for_status()
    key_info = r.json()
    public_key = key_info["key"]
    key_id = key_info["key_id"]

    def encrypt(public_key: str, secret_value: str) -> str:
        public_key_bytes = base64.b64decode(public_key)
        sealed_box = public.SealedBox(public.PublicKey(public_key_bytes))
        encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
        return base64.b64encode(encrypted).decode("utf-8")

    encrypted_value = encrypt(public_key, auth_token)

    secret_url = f"https://api.github.com/repos/{REPO}/actions/secrets/{SECRET_NAME}"
    payload = {
        "encrypted_value": encrypted_value,
        "key_id": key_id
    }

    put = requests.put(secret_url, headers=headers, json=payload)
    if put.status_code in [201, 204]:
        print("✅ GitHub secret updated successfully.")
    else:
        print(f"❌ Failed to update secret ({put.status_code}):\n", put.text)

else:
    print("❌ Bearer token not found.")
