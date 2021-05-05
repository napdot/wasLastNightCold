#include <OneWire.h>
#include <DallasTemperature.h>

#define COLLECT 0
#define CLEAR 1
#define CURRENT 2
#define MIN_TEMP -254

// Timing
const int interval = 3600000; // (60m) * (60s/min) * (1000ms/s) = 1hour
unsigned long previousMillis = 0;
unsigned long currentMillis; 

// Readings
int currentTemp = MIN_TEMP;
const int maxReadings = 240; //24 readings/d * 10 days.
float temperatures[maxReadings]; // array for storing temperatures
int lastReadingIndex = 0; // keep track of last reading index

void setAllToZero() {for (int i=0; i < maxReadings; i++) temperatures[i] = MIN_TEMP;}


// Temperature
#define TEMP_PIN 2
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  delay(100);
  setAllToZero;
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);
  temperatures[lastReadingIndex] = temp;
  lastReadingIndex = (lastReadingIndex++) % maxReadings;
}

void loop() {
  // Get readings at intervals
  currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);
    // Store temperature, update index
    temperatures[lastReadingIndex] = temp;
    lastReadingIndex = (lastReadingIndex++) % maxReadings;
    }
  // Control from serial. Using BT module
  if (Serial.available() > 0) {
    switch(Serial.read()){
      case 0:
      sendTemp;
      break;
      case 1:
      clearTemps;
      break;
      case 2:
      readTemp;
      break;
    }
  }
}

void sendTemp(){
  // Loop the max number of reading.
  // Set j to the last writen index.
  // Print in reverse order until it finds MIN_TEMP value (which is unwritten value).
  // If no MIN_TEMP, then you actually have maxReadings stored (Loop max number of times).
  Serial.print((currentMillis - previousMillis), ", ");
  for (int i=0, j=lastReadingIndex; i < maxReadings; i++ , (j= ((j - 1) % maxReadings))){
    if (temperatures[j] == MIN_TEMP){
      Serial.println();
      break;
    } else {
      Serial.print(temperatures[j], ", "); 
    }
  }
}

void clearTemps(){
  lastReadingIndex = 0;
  setAllToZero;
}

void readTemp(){
  sensors.requestTemperatures();
  Serial.println(sensors.getTempCByIndex(0));
}
