#include <OneWire.h>
#include <DallasTemperature.h>
#define COLLECT "1\r\n"
#define NOREADING -100
// Timing
//#define INTERVAL 5000
#define INTERVAL 900000 // (15min) * (60s/min) * (1000ms/s) = 15minutes
#define MAXREADINGS 288 //4 readings/h * 24h * 3 days.  Essentially every 15 minutes. 432 is every 10m however, takes up 97% of global memory
unsigned long previousMillis = 0;
unsigned long currentMillis; 
// Readings
float temp;
// Limited to 2kb. Each float takes 4 bytes. Teoretically could fit 500 but have other variables
float temperatures[MAXREADINGS]; // array for storing temperatures
unsigned short lastReadingIndex = 0; // keep track of last reading index

void setAllToZero() {for (unsigned short i=0; i < MAXREADINGS; i++) temperatures[i] = NOREADING;}

// Temperature
// Readings are in -55 to +125
#define TEMP_PIN 2
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  delay(100);
  setAllToZero();
  sensors.requestTemperatures();
  temp = sensors.getTempCByIndex(0);
  temperatures[lastReadingIndex] = temp;
}

void loop() {
  // Get readings at intervals
  currentMillis = millis();
  if (currentMillis - previousMillis >= INTERVAL) {
    previousMillis = currentMillis;
    sensors.requestTemperatures();
    temp = sensors.getTempCByIndex(0);
    // Store temperature, update index
    lastReadingIndex = ((lastReadingIndex + 1) % MAXREADINGS);
    temperatures[lastReadingIndex] = temp;
    Serial.println(temperatures[lastReadingIndex]);
    }
  // Control from serial. Using BT module
  if (Serial.available() > 0) {
    //Serial.println("New message");
    if (Serial.readString().equals(COLLECT)){
      sendTemp();
    }
    
  }
}

void sendTemp(){
  // Loop the max number of reading.
  // Set j to the last writen index.
  // Print in reverse order until it finds MIN_TEMP value (which is unwritten value).
  // If no MIN_TEMP, then you actually have maxReadings stored (Loop max number of times).
  Serial.print(currentMillis - previousMillis);
  for (short i=0, j=lastReadingIndex; i < MAXREADINGS; i++ , j = (((j -1) + MAXREADINGS) % MAXREADINGS)){
    if (temperatures[j] == NOREADING){
      Serial.println();
      break;
    } else {
      Serial.print(", ");
      Serial.print(temperatures[j]);
    }
  }
}
