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
        # Find the temperature and power sensors
        temperature_sensor = next((sensor for sensor in w.Sensor() if sensor.SensorType == 'Temperature' and sensor.Name == 'CPU Package'), None)
        power_sensor = next((sensor for sensor in w.Sensor() if sensor.SensorType == 'Power' and 'CPU' in sensor.Name), None)

        # Get the sensor values
        temperature = temperature_sensor.Value if temperature_sensor else None
        power = power_sensor.Value if power_sensor else None
        humidity = max(20, 100 - int(temperature * 1.5)) if temperature else None
        return {
            'temperature': temperature,
            'power': power,
            'humidity': humidity
        }
    
    finally:
        pythoncom.CoUninitialize()

def append_to_csv(data):
    # Create a DataFrame from the sensor data with a timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    new_data = {
        'Timestamp': timestamp,
        'CPU Package Temperature (C)': data['temperature'],
        'CPU Power Consumption (W)': data['power'],  # You can update this field if you have data
        'Humidity (%)': data['humidity']
    }

    # Create a new DataFrame for the new row of data
    new_df = pd.DataFrame([new_data])

    # Read existing CSV (if it exists), or create a new DataFrame if not
    try:
        df = pd.read_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        # If file doesn't exist, create a new one with the correct headers
        df = pd.DataFrame(columns=new_data.keys())

    # Use pd.concat to add the new row to the DataFrame
    df = pd.concat([df, new_df], ignore_index=True)

    # If there are more rows than max_rows, keep only the most recent max_rows rows

    # Write the DataFrame back to the CSV file
    df.to_csv(CSV_FILE_PATH, index=False)


@app.route('/data')
def data():
    sensor_data = get_sensor_data()
    print(sensor_data)
    append_to_csv(sensor_data)  # Append the sensor data to the CSV file
    return jsonify(sensor_data)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005)
