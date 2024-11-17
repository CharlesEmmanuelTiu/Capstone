import socket
import wmi
import time
import random  # For generating random humidity
from datetime import datetime
import csv  # To handle CSV file appending

def monitor_cpu_temperature_and_power():
    w = wmi.WMI(namespace="root/OpenHardwareMonitor")
    
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind(('127.0.0.1', 5005))  # Bind to localhost, port 5005
    
    client_address = None  # Stores the client's address once a message is received

    # Open CSV file in append mode
    with open('cpu_monitoring_log.csv', mode='a', newline='') as file:
        csv_writer = csv.writer(file)
        
        while True:
            # Retrieve the temperature and power sensors
            temperature_sensor = None
            power_sensor = None

            for sensor in w.Sensor():
                if sensor.SensorType == 'Temperature' and sensor.Name == 'CPU Package':
                    temperature_sensor = sensor
                if sensor.SensorType == 'Power' and 'CPU' in sensor.Name:
                    power_sensor = sensor

            # Check if required sensors were found
            if not temperature_sensor:
                print("Temperature sensor not found.")
                break

            # Capture the data
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            temperature = temperature_sensor.Value
            power = power_sensor.Value if power_sensor else 0  # Default to 0 if power sensor is missing
            humidity = max(20, 100 - int(temperature * 1.5))  # Example: inverse correlation with temperature

            # Prepare data for sending and logging
            data = f"{timestamp},{temperature},{power:.2f},{humidity}"
            print(f"Sending data: {data}")

            # Write data to CSV file
            csv_writer.writerow([timestamp, temperature, power, humidity])
            file.flush()  # Ensure data is written immediately

            # Send data to client if connected
            if client_address:
                server_socket.sendto(data.encode(), client_address)

            try:
                # Wait for client connection if not already connected
                if not client_address:
                    print("Waiting for client to connect...")
                    message, client_address = server_socket.recvfrom(1024)  # Receive initial client message
                    print(f"Client connected: {client_address}")
            except socket.timeout:
                continue

            time.sleep(1)  # Sleep before sending the next update

if __name__ == "__main__":
    monitor_cpu_temperature_and_power()
