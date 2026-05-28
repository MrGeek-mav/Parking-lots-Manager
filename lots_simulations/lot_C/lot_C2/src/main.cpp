#include <WiFi.h>
#include <WebServer.h>

// ── Pinos TRIG / ECHO ────────────────────────────────────────
#define TRIG1 5 // usc1
#define ECHO1 18
#define TRIG2 4 // usc2
#define ECHO2 19
#define TRIG3 2 // usc3
#define ECHO3 21
#define TRIG4 15 // usc4
#define ECHO4 22
#define TRIG5 13 // usc5
#define ECHO5 23
#define TRIG6 12 // usc6
#define ECHO6 25

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
  long duration = pulseIn(echo, HIGH, 30000); // timeout 30 ms
  if (duration == 0)
    return -1;
  return duration * 0.034 / 2.0;
}

char *analisarStatus(float d)
{
  if (d < 0)
    return "null";
  else if (d < 20)
    return "Occupied";
  else
    return "Available";
}

// ── JSON ─────────────────────────────────────────────────────
String buildJSON()
{
  float d[6];
  d[0] = medirDistancia(TRIG1, ECHO1);
  d[1] = medirDistancia(TRIG2, ECHO2);
  d[2] = medirDistancia(TRIG3, ECHO3);
  d[3] = medirDistancia(TRIG4, ECHO4);
  d[4] = medirDistancia(TRIG5, ECHO5);
  d[5] = medirDistancia(TRIG6, ECHO6);

  String json = "{\n  \"titulo\": \"AREA C2\",\n  \"sensores\": [\n";
  for (int i = 0; i < 6; i++)
  {
    json += "    { \"id\": \"usc" + String(i + 1) + "\", \"status\": ";
    json += (d[i] < 0 ? "null" : String("\"") + analisarStatus(d[i]) + "\"");
    json += (i < 5 ? " },\n" : " }\n");
  }
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

  int trigs[] = {TRIG1, TRIG2, TRIG3, TRIG4, TRIG5, TRIG6};
  int echos[] = {ECHO1, ECHO2, ECHO3, ECHO4, ECHO5, ECHO6};
  for (int i = 0; i < 6; i++)
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