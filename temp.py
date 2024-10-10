import wmi
import time
import csv
from datetime import datetime

def monitor_cpu_temperature():
    w = wmi.WMI(namespace="root/OpenHardwareMonitor")

    temperature_sensors = [sensor for sensor in w.Sensor() if sensor.SensorType == u'Temperature' and 'CPU' in sensor.Name]

    if not temperature_sensors:
        print("No CPU temperature sensor found.")
        return

    with open('cpu_temperature_log.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Timestamp', 'CPU Temperature (°C)'])

        while True:
            for sensor in temperature_sensors:
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                temperature = sensor.Value
                print(f"{timestamp} - CPU Temperature: {temperature} °C")
                
                writer.writerow([timestamp, temperature])
                
            file.flush()

            time.sleep(2)

if __name__ == "__main__":
    monitor_cpu_temperature()
