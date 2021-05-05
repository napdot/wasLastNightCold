#!/usr/bin/python3

import serial
import sys
from time import sleep
from datetime import datetime, timedelta
import csv

readings = []
reading_timestamp = []


def convertMillis(millis):
    s = (millis / 1000) % 60
    m = (millis / (1000 * 60)) % 60
    return s, m

def with_values():
    val = val_string.split()    # get the values into a list
    t = val.pop(0)  # remove first reading as it it the time since last reading
    s, m = convertMillis(int(t))
    now = datetime.now() - timedelta(minutes=m, seconds=s)

    if len(val) > 0:
        print("New {} readings").format(len(readings))
        for i, reading in enumerate(val):
            readings.append(reading)
            reading_timestamp.append(now - timedelta(hours=i))
        readings.reverse()
        reading_timestamp.reverse()

    else:
        print("No new readings")
        return

    with open(default_file_name, 'w') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerows(zip(reading_timestamp, readings))
        print("Readings saved at {}".format(default_file_name))

    return


if __name__ == "main":
    baudrate = 9600
    port = "/dev/cu.Bluetooth-Incoming-Port"
    default_file_name = "./readings.csv"
    if sys.argv[0]:
        port = sys.argv[0]

    try:
        with serial.Serial(port, baudrate) as ser:
            while True:
                cm = input("0: get Values; 1: clear; 2: current Temp; else: exit")
                if cm == "0":
                    ser.write(0)
                    sleep(1)    # Wait for string
                    val_string = ser.readline()
                    with_values()
                elif cm == "1":
                    ser.write(1)
                elif cm == "2":
                    ser.write(2)
                    sleep(1)  # Wait for string
                    val_string = ser.readline()
                    print("Current temperature: ", val_string)
                else:
                    break

    except KeyboardInterrupt:
        print("Keyboard interrupt")

    except Exception as e:
        print(e)

    print("bb")
