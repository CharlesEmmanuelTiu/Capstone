from flask import Flask, jsonify
from flask_cors import CORS  # Import CORS
import wmi
import pythoncom

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_sensor_data():
    pythoncom.CoInitialize()

    try:
        w = wmi.WMI(namespace="root/OpenHardwareMonitor")
        temperature_sensor = next((sensor for sensor in w.Sensor() if sensor.SensorType == 'Temperature' and sensor.Name == 'CPU Package'), None)
        temperature = temperature_sensor.Value if temperature_sensor else None
        humidity = max(20, 100 - int(temperature * 1.5)) if temperature else None
        return {'temperature': temperature, 'humidity': humidity}
    
    finally:
        pythoncom.CoUninitialize()

@app.route('/data')
def data():
    return jsonify(get_sensor_data())

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005)
