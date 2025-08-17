from seleniumwire import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium_stealth import stealth
import time


options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("window-size=1920,1080")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36")


driver = webdriver.Chrome(service=Service("/usr/local/bin/chromedriver"), options=options)

stealth(driver,
    languages=["en-US", "en"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)

# Also execute JS to overwrite webdriver property:
driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")



# Visit the site
driver.get("https://www.7-eleven.com/locator")
time.sleep(2)
print(driver.title)
print(driver.page_source[:4000])  
# for req in driver.requests:
#     print(req.url, req.headers.get('authorization'))


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
