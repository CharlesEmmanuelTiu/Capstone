import socket
import wmi
import pythoncom
import pandas as pd
import pyaudio
import os
import numpy as np
from datetime import datetime
import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS  # Import Flask-CORS

# UDP server settings to listen for temperature, humidity, water sensor data
UDP_IP = '127.0.0.1'
UDP_PORT = 12345

# CSV file path to store the data
CSV_FILE_PATH = 'cpu_monitoring_log.csv'

# Microphone settings
FORMAT = pyaudio.paInt16  # Format for the audio data (16-bit)
CHANNELS = 1  # Mono sound
RATE = 44100  # Sampling rate (samples per second)
CHUNK = 1024  # Size of the chunk to read at a time
DURATION = 0.1  # Duration in seconds to record at a time

# Flask app for HTTP requests
app = Flask(__name__)
CORS(app)  # Enable CORS

# Create a UDP socket to receive data from Arduino and microphone
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_socket.bind((UDP_IP, UDP_PORT))

# Initialize pyaudio
p = pyaudio.PyAudio()

# Global variable to store sensor data
combined_data = {
    'temperature': None,
    'power': None,
    'humidity': None,
    'water_level': None,
    'mic_decibels': None
}

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

# Function to append data to the CSV file
def append_to_csv(data):
    """Append sensor data to the CSV file."""
    # Check if the file exists
    file_exists = os.path.exists(CSV_FILE_PATH)

    # Define the column names
    columns = ['Timestamp', 'Temperature (°C)', 'Power (W)', 'Humidity (%)', 'Water Level', 'Mic Decibels (dB)']

    # Prepare the data row
    row = {
        'Timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'Temperature (°C)': data['temperature'],
        'Power (W)': data['power'],
        'Humidity (%)': data['humidity'],
        'Water Level': data['water_level'],
        'Mic Decibels (dB)': data['mic_decibels']
    }

    # Append to the CSV
    try:
        df = pd.DataFrame([row])
        if not file_exists:
            # Write the header if the file doesn't exist
            df.to_csv(CSV_FILE_PATH, mode='w', index=False, header=True)
        else:
            # Append without the header
            df.to_csv(CSV_FILE_PATH, mode='a', index=False, header=False)
    except Exception as e:
        print(f"Error writing to CSV: {e}")

# Function to calculate the decibel level from audio data
def calculate_decibels(data):
    """Calculate the decibel level from raw audio data."""
    audio_data = np.frombuffer(data, dtype=np.int16)
    
    # Calculate the RMS (Root Mean Square) value
    rms = np.sqrt(np.mean(audio_data**2))
    
    # Convert RMS to decibels (dB)
    if rms > 0:
        decibels = 20 * np.log10(rms)
    else:
        decibels = -np.inf  # If no sound is detected, return a very low value
    
    return decibels

# Function to monitor the microphone and return the decibel level
def monitor_microphone():
    """Continuously monitor the microphone and return the current decibel level."""
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)
    
    data = stream.read(CHUNK, exception_on_overflow=False)
        
    # Calculate the decibel level
    decibels = calculate_decibels(data)
        
    # Update the global variable or store it to be sent to CSV
    global mic_decibels
    mic_decibels = decibels

# Function to handle receiving sensor data from UDP and saving it with decibel data
def handle_sensor_data():
    global combined_data  # Declare that we're using the global variable combined_data
    global mic_decibels

    # Listen for UDP data
    data, addr = udp_socket.recvfrom(1024)  # Buffer size is 1024 bytes

    try:
        sensor_data = data.decode('utf-8', errors='replace')  # Decode received data
    except UnicodeDecodeError as e:
        print(f"Error decoding data: {e}")

    print(f"Received Data: {sensor_data}")  # Print the raw data for debugging
    # Check if data contains humidity and temperature
    if "Humidity:" in sensor_data and "Temp:" in sensor_data:
        try:
            sensor_data = sensor_data.replace("%%", "%")  # Fix extra percent symbols
            humidity_part, temp_part = sensor_data.split(' Temp:')
            humidity = humidity_part.replace("Humidity: ", "").strip()
            humidity = float(humidity.replace('%', '').strip())
            temp_celsius, temp_fahrenheit = temp_part.split('°C ')
            temp_celsius = temp_celsius.strip()
            temp_fahrenheit = temp_fahrenheit.replace("°F", "").strip()

            # Fetch power data
            power = get_power_data()

            # Update the global combined_data dictionary
            combined_data.update({
                'temperature': temp_celsius,
                'power': f"{float(power):.2f}" if power is not None else None,
                'humidity': humidity,
                'mic_decibels': f"{mic_decibels:.2f}"  # Add microphone decibels to the data
            })
            
            #append_to_csv(combined_data)

        except ValueError as e:
            print(f"Error processing temperature/humidity data: {e}")
    # Check if data contains water level or water detection status
    elif "Humidity" not in sensor_data:
        print("WTF BROOOOOOOOOOOOOOOOOOOOn")
        if int(sensor_data) < 100:
            combined_data['water_level'] = 0  # Water detected (1)
        elif int(sensor_data) > 100:
            combined_data['water_level'] = 1  # No water detected (0)
    print("COME BACK")
    # Append water level to the CSV if present
    if 'water_level' in combined_data:
        append_to_csv(combined_data)

# API route to fetch sensor data from the server
@app.route('/data', methods=['GET'])
def get_sensor_data():
    global combined_data  # Access the global combined_data variable
    handle_sensor_data()
    sensor_data = {
        'temperature': combined_data['temperature'],
        'power': combined_data['power'],
        'humidity': combined_data['humidity'],
        'water_level': combined_data['water_level'],
        'mic_decibels': combined_data['mic_decibels']
    }
    print(sensor_data)
    return jsonify(sensor_data)

def main():
    print(f"Listening for UDP packets on {UDP_IP}:{UDP_PORT}...")

    # Start the microphone monitoring in a separate thread
    mic_thread = threading.Thread(target=monitor_microphone, daemon=True)
    mic_thread.start()

    # Start handling sensor data in a separate thread
    handle_thread = threading.Thread(target=handle_sensor_data, daemon=True)
    handle_thread.start()

    # Start the Flask app to serve data
    app.run(host='0.0.0.0', port=5005)

if __name__ == "__main__":
    main()
