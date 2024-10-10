import socket
import wmi
import time
import random  # For generating random humidity
from datetime import datetime

def monitor_cpu_temperature_and_power():
    w = wmi.WMI(namespace="root/OpenHardwareMonitor")

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind(('127.0.0.1', 5005))  # Bind to any address, port 5005

    client_address = None  # Will store the client's address once a message is received

    while True:
        temperature_sensor = None
        power_sensor = None

        for sensor in w.Sensor():
            if sensor.SensorType == u'Temperature' and sensor.Name == 'CPU Package':
                temperature_sensor = sensor
            if sensor.SensorType == u'Power' and 'CPU' in sensor.Name:
                power_sensor = sensor

        if not temperature_sensor or not power_sensor:
            print("Required sensors not found.")
            break

        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        temperature = temperature_sensor.Value
        power = power_sensor.Value if power_sensor.Value is not None else 0

        # Generate a random humidity that inversely correlates with CPU temperature
        humidity = max(20, 100 - int(temperature * 1.5))  # Example: higher temp, lower humidity

        data = f"{timestamp},{temperature},{power:.2f},{humidity}"  # Include humidity in the data

        print(f"Sending data: {data}")

        if client_address:
            server_socket.sendto(data.encode(), client_address)  # Send data to the client

        try:
            if not client_address:
                print("Waiting for client to connect...")
                message, client_address = server_socket.recvfrom(1024)  # Receive initial client message
                print(f"Client connected: {client_address}")
        except socket.timeout:
            continue

        time.sleep(1)  # Sleep before sending the next update

if __name__ == "__main__":
    monitor_cpu_temperature_and_power()
