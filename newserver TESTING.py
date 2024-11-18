import socket
import wmi
import pythoncom
import pandas as pd
from datetime import datetime

# UDP server settings to listen for temperature and humidity data
UDP_IP = '0.0.0.0'  # Listen on all available interfaces
UDP_PORT = 12345     # Port to listen on (must match the client code)

# CSV file path to store the data
CSV_FILE_PATH = 'cpu_monitoring_log.csv'

# Create a UDP socket to receive data from Arduino
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_socket.bind((UDP_IP, UDP_PORT))

# Function to fetch power data using WMI
def get_power_data():
    pythoncom.CoInitialize()
    try:
        w = wmi.WMI(namespace="root/OpenHardwareMonitor")
        # Find the power sensor for CPU
        power_sensor = next((sensor for sensor in w.Sensor() if sensor.SensorType == 'Power' and 'CPU' in sensor.Name), None)
        power = power_sensor.Value if power_sensor else None
        return power
    finally:
        pythoncom.CoUninitialize()

# Function to append data to CSV file
def append_to_csv(data):
    # Create a DataFrame from the sensor data with a timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    new_data = {
        'Timestamp': timestamp,
        'Temperature (C)': data['temperature'],
        'Humidity (%)': data['humidity'],
        'Power Consumption (W)': data['power']
    }

    print(new_data)
    # Create a new DataFrame for the new row of data
    new_df = pd.DataFrame([new_data])
    print(new_df)
    # Read existing CSV (if it exists), or create a new one if not
    try:
        df = pd.read_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        # If file doesn't exist, create a new one with the correct headers
        df = pd.DataFrame(columns=new_data.keys())

    # Use pd.concat to add the new row to the DataFrame
    df = pd.concat([df, new_df], ignore_index=True)

    # Write the DataFrame back to the CSV file
    df.to_csv(CSV_FILE_PATH, index=False)

def main():
    print(f"Listening for UDP packets on {UDP_IP}:{UDP_PORT}...")

    # Receive data from the Arduino client
    data, addr = udp_socket.recvfrom(1024)  # Buffer size is 1024 bytes
    
    # Decode the received data using UTF-8 (default for Arduino)
    try:
        sensor_data = data.decode('utf-8', errors='replace')  # Try decoding as UTF-8
    except UnicodeDecodeError as e:
        print(f"Error decoding data: {e}")

    print(f"Received Data: {sensor_data}")  # Print the raw data for debugging
    
    # Clean up the received data if necessary (fix the encoding problem with the degree symbol)
    #   # Manually fix the degree symbol

    # Ensure the received data is valid and follows expected format
    if "Humidity:" in sensor_data and "Temp:" in sensor_data:
        try:
            # Fix for the issue of extra percent signs and unexpected format variations
            sensor_data = sensor_data.replace("%%", "%")  # Clean up extra percent symbols
            
            # Split the data based on the expected format
            humidity_part, temp_part = sensor_data.split(' Temp:')

            # Extract humidity and temperature values
            humidity = humidity_part.replace("Humidity: ", "").strip()
            temp_celsius, temp_fahrenheit = temp_part.split('°C ')

            temp_celsius = temp_celsius.strip()
            temp_fahrenheit = temp_fahrenheit.replace("°F", "").strip()

            # Fetch power data from the system
            power = get_power_data()

            # Create a dictionary to hold the combined data
            combined_data = {
                'temperature': temp_celsius,
                'humidity': humidity,
                'power': power
            }

            print(f"Combined Data - Temp: {temp_celsius}°C, Humidity: {humidity}%, Power: {power}W")
            # Save the combined data to the CSV file
            append_to_csv(combined_data)

        except ValueError as e:
            print(f"Error processing data: {e}")
    else:
        print("Data format not recognized, skipping...")

if __name__ == "__main__":
    main()
