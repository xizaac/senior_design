/**
 * Smart Poker Table — ESP32-WROOM-32 Firmware
 * 
 * This sketch:
 *  1. Connects to WiFi
 *  2. Reads card data from RFID sensors
 *  3. Computes win odds (your existing logic goes here)
 *  4. POSTs game state to the backend API whenever state changes
 * 
 * Dependencies (install via Arduino Library Manager):
 *  - ArduinoJson (by Benoit Blanchon) >= 7.x
 *  - HTTPClient (built into ESP32 Arduino core)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Configuration ─────────────────────────────────────────────────────────────

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your deployed backend URL or local IP during testing
const char* BACKEND_URL   = "https://your-backend.railway.app/api/esp32/update";
const char* API_KEY       = "your-secret-esp32-key-here";  // must match backend .env

// The active session code — set this after creating a session from the website
// or read it from a display/button on the physical table
const char* SESSION_CODE  = "ABC123";

// How often to send updates (milliseconds)
const unsigned long UPDATE_INTERVAL = 1000;

// ── Data Structures ───────────────────────────────────────────────────────────

struct Card {
  String rank;  // "A","2","3"..."K"
  String suit;  // "hearts","diamonds","clubs","spades"
  bool detected;
};

struct Player {
  int   seat;
  Card  cards[2];
  float winOdds;
};

// ── Global State ──────────────────────────────────────────────────────────────

Player players[4];
Card   communityCards[5];
String currentPhase = "pre-flop";
unsigned long lastUpdate = 0;

// ── Setup ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);

  // Initialize player seats
  for (int i = 0; i < 4; i++) {
    players[i].seat = i + 1;
    players[i].winOdds = 25.0;  // equal before any cards
    players[i].cards[0].detected = false;
    players[i].cards[1].detected = false;
  }

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected: " + WiFi.localIP().toString());

  // Verify backend connectivity
  pingBackend();
}

// ── Main Loop ─────────────────────────────────────────────────────────────────

void loop() {
  // ---- YOUR RFID READING LOGIC GOES HERE ----
  // Example: read RFID tags and map to card rank/suit
  // readRFIDSensors();
  // computeWinOdds(players, communityCards);
  // -------------------------------------------

  // Send update every UPDATE_INTERVAL ms if state changed
  if (millis() - lastUpdate >= UPDATE_INTERVAL) {
    sendGameState();
    lastUpdate = millis();
  }
}

// ── Ping backend to verify connection ────────────────────────────────────────

void pingBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String pingUrl = String(BACKEND_URL);
  // Replace /update with /ping
  pingUrl.replace("/update", "/ping");

  http.begin(pingUrl);
  http.addHeader("x-api-key", API_KEY);
  int code = http.GET();
  Serial.println(code == 200 ? "✅ Backend reachable" : "❌ Backend ping failed: " + String(code));
  http.end();
}

// ── Build and send JSON payload to backend ───────────────────────────────────

void sendGameState() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected — skipping update");
    return;
  }

  // Build JSON
  JsonDocument doc;
  doc["sessionCode"] = SESSION_CODE;
  doc["phase"]       = currentPhase;

  // Players array
  JsonArray playersArr = doc["players"].to<JsonArray>();
  for (int i = 0; i < 4; i++) {
    JsonObject p = playersArr.add<JsonObject>();
    p["seat"]     = players[i].seat;
    p["winOdds"]  = players[i].winOdds;

    JsonArray cardsArr = p["cards"].to<JsonArray>();
    for (int c = 0; c < 2; c++) {
      if (players[i].cards[c].detected) {
        JsonObject card = cardsArr.add<JsonObject>();
        card["rank"] = players[i].cards[c].rank;
        card["suit"] = players[i].cards[c].suit;
      }
    }
  }

  // Community cards
  JsonArray commArr = doc["communityCards"].to<JsonArray>();
  for (int i = 0; i < 5; i++) {
    if (communityCards[i].detected) {
      JsonObject card = commArr.add<JsonObject>();
      card["rank"] = communityCards[i].rank;
      card["suit"] = communityCards[i].suit;
    }
  }

  String payload;
  serializeJson(doc, payload);

  // POST to backend
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  int responseCode = http.POST(payload);

  if (responseCode == 200) {
    Serial.println("📡 State sent OK");
  } else {
    Serial.println("❌ Send failed: HTTP " + String(responseCode));
    String resp = http.getString();
    Serial.println(resp);
  }

  http.end();
}

// ── Helper: set a player card (call from your RFID logic) ────────────────────

void setPlayerCard(int seat, int cardIndex, String rank, String suit) {
  if (seat < 1 || seat > 4 || cardIndex < 0 || cardIndex > 1) return;
  players[seat - 1].cards[cardIndex].rank     = rank;
  players[seat - 1].cards[cardIndex].suit     = suit;
  players[seat - 1].cards[cardIndex].detected = true;
}

// Helper: set community card
void setCommunityCard(int index, String rank, String suit) {
  if (index < 0 || index > 4) return;
  communityCards[index].rank     = rank;
  communityCards[index].suit     = suit;
  communityCards[index].detected = true;
}

// Helper: set player win odds (from your computation)
void setWinOdds(int seat, float odds) {
  if (seat < 1 || seat > 4) return;
  players[seat - 1].winOdds = odds;
}
