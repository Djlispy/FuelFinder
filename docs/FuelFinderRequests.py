import requests
import json
import os
import sys

try:
    AUTH_TOKEN = os.environ["AUTH_TOKEN"]
except KeyError:
    print("Error: AUTH_TOKEN not found.")
    sys.exit(1)



# API endpoint and headers
url = "https://apis.7-eleven.com/v5/stores/graphql"


headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

# Location variables
lat = "28.01459858651087"
lon = "-82.50638600898436"
radius = 36.223161207437876

# GraphQL query and payload
payload = {
    "operationName": "stores",
    "query": """
        query stores($lat: String, $lon: String, $radius: Float, $limit: Int, $curr_lat: String, $curr_lon: String, $filters: [String]) {
          stores(
            lat: $lat
            lon: $lon
            radius: $radius
            limit: $limit
            curr_lat: $curr_lat
            curr_lon: $curr_lon
            filters: $filters
          ) {
            address
            brand { slug logo }
            distance_label
            distance
            lat
            lon
            hours
            id
            name
            city
            phone
            state
            country
            postal_code
            franchise
            features { slug title }
            services { slug title }
            local_content
            fuel_data
            local_images
          }
        }
    """,
    "variables": {
        "lat": lat,
        "lon": lon,
        "radius": radius,
        "limit": 500,
        "curr_lat": lat,
        "curr_lon": lon,
        "filters": ["service:gas"]
    }
}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"❌ Network or request error: {e}")
    sys.exit(1)

try:
    data = response.json()
except json.JSONDecodeError:
    print("❌ Failed to parse JSON response.")
    sys.exit(1)

# Filter and format the data
filtered = []

try:
    stores = data.get("data", {}).get("stores", [])
    for store in stores:
        if store.get("brand", {}).get("slug") != "7-eleven":
            continue

        service_slugs = {s["slug"] for s in store.get("services", [])}
        if "fuel_price_lock" not in service_slugs:
            continue

        grades = {g["abbr"]: g.get("price") for g in (store.get("fuel_data") or {}).get("grades", [])}

        formatted = {
            "lat": store.get("lat"),
            "lon": store.get("lon"),
            "address": store.get("address"),
            "city": store.get("city"),
            "phone": store.get("phone"),
            "state": store.get("state"),
            "country": store.get("country"),
            "postal_code": store.get("postal_code"),
            "regular_price": grades.get("RUL") / 1000 if grades.get("RUL") else None,
            "mid_grade_price": grades.get("NMB") / 1000 if grades.get("NMB") else None,
            "premium_price": grades.get("PUL") / 1000 if grades.get("PUL") else None,
            "diesel_price": grades.get("DSL") / 1000 if grades.get("DSL") else None,
            "last_updated_label": store.get("fuel_data", {}).get("last_updated_label")
        }

        filtered.append(formatted)
except Exception as e:
    print(f"❌ Error processing store data: {e}")
    sys.exit(1)

# Save cleaned, filtered output
try:
    os.makedirs("docs", exist_ok=True)
    with open("docs/locations.json", "w") as f:
        json.dump(filtered, f, indent=2)
    print("✅ Saved data to 'docs/locations.json'")
except Exception as e:
    print(f"❌ Failed to save JSON file: {e}")
    sys.exit(1)