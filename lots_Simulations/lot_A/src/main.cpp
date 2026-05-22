#include <WiFi.h>
#include <WebServer.h>

// ── Pinos TRIG / ECHO ────────────────────────────────────────
#define TRIG1 5
#define ECHO1 18
#define TRIG2 4
#define ECHO2 19
#define TRIG3 2
#define ECHO3 21
#define TRIG4 15
#define ECHO4 22
const char *ssid = "Wokwi-GUEST";
const char *password = "";

WebServer server(80);

// ── Medir distância ──────────────────────────────────────────
float medirDistancia(int trig, int echo)
{
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duration = pulseIn(echo, HIGH, 30000); // timeout 30ms
  if (duration == 0)
    return -1; // sem resposta
  return duration * 0.034 / 2.0;
}

// ── JSON ─────────────────────────────────────────────────────
String buildJSON()
{
  float d1 = medirDistancia(TRIG1, ECHO1);
  float d2 = medirDistancia(TRIG2, ECHO2);
  float d3 = medirDistancia(TRIG3, ECHO3);
  float d4 = medirDistancia(TRIG4, ECHO4);

  String json = "{\n";
  json += "  \"titulo\": \"area a\",\n";
  json += "  \"sensores\": [\n";
  json += "    { \"id\": \"usc1\", \"distancia_cm\": " + (d1 < 0 ? "null" : String(d1, 1)) + " },\n";
  json += "    { \"id\": \"usc2\", \"distancia_cm\": " + (d2 < 0 ? "null" : String(d2, 1)) + " },\n";
  json += "    { \"id\": \"usc3\", \"distancia_cm\": " + (d3 < 0 ? "null" : String(d3, 1)) + " },\n";
  json += "    { \"id\": \"usc4\", \"distancia_cm\": " + (d4 < 0 ? "null" : String(d4, 1)) + " }\n";
  json += "  ]\n}";
  return json;
}

// ── Rotas ────────────────────────────────────────────────────
void handleData()
{
  String json = buildJSON();
  Serial.println(json);
  server.send(200, "application/json", json);
}

void handleNotFound()
{
  if (server.uri() == "/favicon.ico")
  {
    server.send(204, "text/plain", "");
    return;
  }
  server.send(404, "application/json", "{\"erro\": \"rota nao encontrada\"}");
}

// ── Setup ────────────────────────────────────────────────────
void setup()
{
  Serial.begin(115200);

  // configura pinos
  int trigs[] = {TRIG1, TRIG2, TRIG3, TRIG4};
  int echos[] = {ECHO1, ECHO2, ECHO3, ECHO4};
  for (int i = 0; i < 4; i++)
  {
    pinMode(trigs[i], OUTPUT);
    pinMode(echos[i], INPUT);
    digitalWrite(trigs[i], LOW);
  }

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado! IP: " + WiFi.localIP().toString());

  server.on("/", handleData);
  server.on("/data", handleData);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("Servidor JSON iniciado.");
}

// ── Loop ─────────────────────────────────────────────────────
void loop()
{
  server.handleClient();
}