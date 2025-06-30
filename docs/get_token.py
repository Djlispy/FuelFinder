from seleniumwire import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium_stealth import stealth

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("window-size=1920,1080")

driver = webdriver.Chrome(service=Service("/usr/local/bin/chromedriver"), options=options)

# Stealth to reduce detection
stealth(driver,
    languages=["en-US", "en"],
    vendor="Google Inc.",
    platform="MacIntel",
    webgl_vendor="Apple Inc.",
    renderer="Apple M1",
    fix_hairline=True,
)

# Visit the site
driver.get("https://www.7-eleven.com/locator")

# Look through requests for the token
token = None
for request in driver.requests:
    if request.headers.get('authorization', '').startswith('Bearer '):
        token = request.headers['authorization']
        break

driver.quit()

if token:
    print("✅ Bearer token found:")
    print(token)
else:
    print("❌ No Bearer token found.")
