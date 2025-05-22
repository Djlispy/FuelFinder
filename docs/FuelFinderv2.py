### ------------------------ ###
##  UPDATE CHROME BEFORE USE  ##
### ------------------------ ###

import json
import undetected_chromedriver as uc
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import time

# Enable performance logging
capabilities = DesiredCapabilities.CHROME
capabilities['goog:loggingPrefs'] = {'performance': 'ALL'}

options = uc.ChromeOptions()

options.add_argument('--window-size=1920,1080')

driver = uc.Chrome(options=options, desired_capabilities=capabilities)

driver.get("https://www.7-eleven.com/locator")


WebDriverWait(driver, 10).until(
    EC.visibility_of_element_located((By.ID, 'form_location'))
)

search_input = driver.find_element(By.ID, 'form_location')

search_input.send_keys("33614")

# Wait for the search button to be clickable
search_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.XPATH, "//input[@value='Search']"))
)

search_button.click()

zoom_out_button = driver.find_element(By.CLASS_NAME, 'ZoomButton_se-control-zoom-out__f8HkR')

# Click the Zoom Out button twice
zoom_out_button.click()
time.sleep(1.5)
zoom_out_button.click()
time.sleep(1.5)
zoom_out_button.click()
time.sleep(9)

# driver.save_screenshot('debug.png')

logs = driver.get_log('performance')

graphql_responses = []
for entry in logs:
    message = json.loads(entry['message'])['message']
    if message['method'] == 'Network.responseReceived':
        url = message['params']['response']['url']
        if 'graphql' in url.lower():
            try:
                response_body = driver.execute_cdp_cmd('Network.getResponseBody', {
                    'requestId': message['params']['requestId']
                })
                try:
                    json_response = json.loads(response_body['body'])
                    store_count = len(json_response.get('data', {}).get('stores', []))
                except json.JSONDecodeError:
                    store_count = 0
                graphql_responses.append({
                    'url': url,
                    'body': response_body['body'],
                    'timestamp': message['params']['timestamp'],
                    'store_count': store_count
                })
                print(f"GraphQL Response: URL={url}, Stores={store_count}, Timestamp={message['params']['timestamp']}")
            except Exception as e:
                print(f"Could not retrieve response body for {url}: {e}")

    # Capture GraphQL request details for pagination
    if message['method'] == 'Network.requestWillBeSent':
        url = message['params']['request']['url']
        if 'graphql' in url.lower():
            print(f"GraphQL Request URL: {url}, Timestamp={message['params']['timestamp']}")
            print("Request Details:", message['params']['request'])

# Process the last GraphQL response
if graphql_responses:
    last_response = max(graphql_responses, key=lambda x: x['timestamp'])
    print(f"\nLast GraphQL Response URL: {last_response['url']}")
    print(f"Number of Stores: {last_response['store_count']}")

    try:
        json_response = json.loads(last_response['body'])
        stores = json_response.get('data', {}).get('stores', [])
        extracted_stores = []

        for store in stores:
            # Extract fuel prices from fuel_data.grades
            fuel_info = store.get('fuel_data', {}) or {}
            grades = fuel_info.get('grades', [])
            regular_price = None
            mid_grade_price = None
            premium_price = None
            diesel_price = None

            # Map grades to requested price fields
            for grade in grades:
                price = grade.get('price')
                if price is not None:
                    price = price / 1000  # Convert integer (e.g., 3199) to decimal (e.g., 3.199)
                if grade.get('abbr') == 'RUL':
                    regular_price = price
                elif grade.get('abbr') == 'NMB':
                    mid_grade_price = price
                elif grade.get('abbr') == 'PUL':
                    premium_price = price
                elif grade.get('abbr') == 'DSL':
                    diesel_price = price

            extracted_store = {
                'lat': store.get('lat'),
                'lon': store.get('lon'),
                'id': store.get('id'),
                'name': store.get('name'),
                'city': store.get('city'),
                'phone': store.get('phone'),
                'state': store.get('state'),
                'country': store.get('country'),
                'postal_code': store.get('postal_code'),
                'regular_price': regular_price,
                'mid_grade_price': mid_grade_price,
                'premium_price': premium_price,
                'diesel_price': diesel_price,
                'last_updated_label': fuel_info.get('last_updated_label')
            }
            extracted_stores.append(extracted_store)

        # Print summary
        print(f"\nTotal Stores Extracted: {len(extracted_stores)}")

        # Save all stores to a file
        with open('docs/locations.json', 'w') as f:
            json.dump(extracted_stores, f, indent=2)
        print("\nSaved all stores to 'locations.json'")

    except json.JSONDecodeError:
        print("Last response is not valid JSON")
else:
    print("No GraphQL responses found")


driver.quit()
