import undetected_chromedriver as uc
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import json 


import time

capabilities = DesiredCapabilities.CHROME
capabilities['goog:loggingPrefs'] = {'performance': 'ALL'}
capabilities['pageLoadStrategy'] = 'eager'

options = uc.ChromeOptions()

options.add_argument('--window-size=1920,1080')
# options.add_argument('--disable-extensions')
# options.add_argument('--disable-gpu')
# options.add_argument('--no-sandbox')
# options.add_argument('--disable-dev-shm-usage')
# options.add_argument('--disable-blink-features=AutomationControlled')

# prefs = {
#     "profile.managed_default_content_settings.images": 2,
#     "profile.managed_default_content_settings.stylesheets": 2,
#     "profile.managed_default_content_settings.fonts": 2
# }
# options.add_experimental_option("prefs", prefs)


driver = uc.Chrome(options=options, desired_capabilities=capabilities)

driver.get("https://www.7-eleven.com/locator")

time.sleep(9)
# Extract performance logs
logs = driver.get_log("performance")

for entry in logs:
    try:
        log = json.loads(entry["message"])["message"]
        if log.get("method") == "Network.requestWillBeSent":
            request = log["params"]["request"]
            url = request.get("url", "").lower()
            headers = request.get("headers", {})
            auth = headers.get("authorization") or headers.get("Authorization")

            if "graphql" in url and auth and auth.startswith("Bearer "):
                print("Bearer token found:")
                print(auth)
                break
    except (KeyError, ValueError, TypeError):
        continue
else:
    print("No Bearer token found in GraphQL requests.")

driver.quit()
