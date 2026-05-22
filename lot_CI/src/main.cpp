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
#define TRIG5 13
#define ECHO5 12
#define TRIG6 14
#define ECHO6 27

WebServer server(80);

const char *ssid = "Wokwi-GUEST";
const char *password = "";

int trigs[] = {TRIG1, TRIG2, TRIG3, TRIG4, TRIG5, TRIG6};
int echos[] = {ECHO1, ECHO2, ECHO3, ECHO4, ECHO5, ECHO6};

// ── Medir distância ──────────────────────────────────────────
float medirDistancia(int trig, int echo)
{
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duration = pulseIn(echo, HIGH, 30000);
  if (duration == 0)
    return -1;
  return duration * 0.034 / 2.0;
}

// ── JSON ─────────────────────────────────────────────────────
String buildJSON()
{
  String json = "{\n";
  json += "  \"titulo\": \"area C\",\n";
  json += "  \"sensores\": [\n";

  for (int i = 0; i < 6; i++)
  {
    float d = medirDistancia(trigs[i], echos[i]);
    String val = (d < 0) ? "null" : String(d, 1);

    json += "    { \"id\": \"usc" + String(i + 1) + "\",";
    json += " \"distancia_cm\": " + val + " }";
    json += (i < 5) ? ",\n" : "\n";
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