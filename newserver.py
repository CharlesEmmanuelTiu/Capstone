from flask import Flask, jsonify
from flask_cors import CORS
import wmi
import pythoncom
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

CSV_FILE_PATH = 'cpu_monitoring_log.csv'

def get_sensor_data():
    pythoncom.CoInitialize()

    try:
        w = wmi.WMI(namespace="root/OpenHardwareMonitor")

        # Retrieve all available sensors
        sensors = w.Sensor()

        # Find the temperature and power sensors
        temperature_sensor = next((sensor for sensor in sensors if sensor.SensorType == 'Temperature' and sensor.Name == 'CPU Package'), None)
        power_sensor = next((sensor for sensor in sensors if sensor.SensorType == 'Power' and 'CPU' in sensor.Name), None)

        # Debug: List all available sensors
        if not power_sensor:
            print("Available sensors:")
            for sensor in sensors:
                print(f"Name: {sensor.Name}, Type: {sensor.SensorType}, Value: {sensor.Value}")

        # Get sensor values with appropriate defaults
        temperature = temperature_sensor.Value if temperature_sensor else None
        power = power_sensor.Value if power_sensor else 0.0  # Default to 0 if not found
        humidity = max(20, 100 - int(temperature * 1.5)) if temperature else None

        return {
            'temperature': temperature,
            'power': f"{float(power):.2f}" if power is not None else None,
            'humidity': humidity
        }

    finally:
        pythoncom.CoUninitialize()


def append_to_csv(data):
    # Define the expected columns
    expected_columns = ['Timestamp', 'CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']

    # Create a new row of data
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    new_data = {
        'Timestamp': timestamp,
        'CPU Package Temperature (C)': data['temperature'],
        'CPU Power Consumption (W)': data['power'],
        'Humidity (%)': data['humidity']
    }
    new_row = pd.DataFrame([new_data])

    try:
        # Read the existing CSV file
        df = pd.read_csv(CSV_FILE_PATH, encoding='ISO-8859-1')

        # Validate that the columns match the expected structure
        if list(df.columns) != expected_columns:
            raise ValueError("CSV columns do not match expected format.")
    except FileNotFoundError:
        # If the file doesn't exist, create an empty DataFrame with expected columns
        df = pd.DataFrame(columns=expected_columns)

    # Append the new row to the DataFrame
    df = pd.concat([df, new_row], ignore_index=True)

    # Ensure the DataFrame has the correct column order
    df = df[expected_columns]

    # Write the updated DataFrame back to the CSV
    df.to_csv(CSV_FILE_PATH, index=False, encoding='ISO-8859-1')


@app.route('/data')
def data():
    sensor_data = get_sensor_data()
    print(sensor_data)
    append_to_csv(sensor_data)  # Append the sensor data to the CSV file
    return jsonify(sensor_data)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005)
