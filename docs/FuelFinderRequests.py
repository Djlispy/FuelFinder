import requests
import json
import os
import sys
import logging
from datetime import datetime

# --- Setup logging ---
log_file = "FuelFinder.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, mode='a'),
        logging.StreamHandler(sys.stdout)
    ]
)

# --- Get AUTH_TOKEN from environment ---
try:
    AUTH_TOKEN = os.environ["AUTH_TOKEN"]
except KeyError:
    logging.error("AUTH_TOKEN environment variable not found.")
    sys.exit(1)

# --- API setup ---
url = "https://apis.7-eleven.com/v5/stores/graphql"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

lat = "28.01459858651087"
lon = "-82.50638600898436"
radius = 36.223161207437876

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

# --- Send request ---
try:
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    logging.error(f"Request failed: {e}")
    sys.exit(1)

# --- Parse JSON response ---
try:
    data = response.json()
except json.JSONDecodeError as e:
    logging.error(f"JSON decoding failed: {e}")
    sys.exit(1)

# --- Process store data ---
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
    logging.error(f"Error processing data: {e}")
    sys.exit(1)

# --- Save data to file ---
try:
    os.makedirs("docs", exist_ok=True)
    with open("docs/locations.json", "w") as f:
        json.dump(filtered, f, indent=2)
    logging.info(f"Saved {len(filtered)} stores to 'docs/locations.json'")
except Exception as e:
    logging.error(f"Failed to save file: {e}")
    sys.exit(1)
