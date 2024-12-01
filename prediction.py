from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:8000", "http://localhost:8000"]}})

# Load the trained model and scalers
model = tf.keras.models.load_model('temperature_model.h5')  # Ensure the model file matches the saved one
scaler = joblib.load('scaler.pkl')  # Load the feature scaler
target_scaler = joblib.load('target_scaler.pkl')  # Load the target scaler

# Define the sequence length used during training
SEQ_LENGTH = 10  # Match this with the value used in training

@app.route('/predict', methods=['GET'])
def predict():
    try:
        # Load and preprocess input data
        input_data = pd.read_csv(
            'cpu_monitoring_log.csv',
            encoding='ISO-8859-1',
            on_bad_lines='warn'  # Warn and skip problematic lines
        )
        input_data = input_data[['Timestamp', 'CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']]
        input_data = input_data.dropna()
        input_data['Timestamp'] = pd.to_datetime(input_data['Timestamp'], errors='coerce')

        if 'Timestamp' not in input_data.columns or input_data['Timestamp'].isna().all():
            return jsonify(error="Invalid or missing Timestamp column"), 400

        # Extract datetime components
        input_data['Year'] = input_data['Timestamp'].dt.year
        input_data['Month'] = input_data['Timestamp'].dt.month
        input_data['Day'] = input_data['Timestamp'].dt.day
        input_data['Hour'] = input_data['Timestamp'].dt.hour
        input_data['Minute'] = input_data['Timestamp'].dt.minute
        input_data['Second'] = input_data['Timestamp'].dt.second

        # Save and drop the Timestamp column
        timestamps = input_data['Timestamp'].copy()  # Save original timestamps
        input_data = input_data.drop(columns=['Timestamp'])

        # Scale the input data
        scaler = joblib.load('scaler.pkl')
        scaled_data = scaler.transform(input_data)

        if len(scaled_data) < SEQ_LENGTH:
            return jsonify(error="Not enough data to generate sequences"), 400

        # Prepare sequences for prediction
        X = [scaled_data[i:i + SEQ_LENGTH] for i in range(len(scaled_data) - SEQ_LENGTH)]
        X = np.array(X)

        # Predict the future metrics
        model = tf.keras.models.load_model('temperature_model.h5')
        predicted_metrics = model.predict(X)

        # Inverse scale the predictions
        target_scaler = joblib.load('target_scaler.pkl')
        predicted_full = np.zeros((predicted_metrics.shape[0], scaled_data.shape[1]))
        predicted_full[:, :3] = predicted_metrics
        predictions = scaler.inverse_transform(predicted_full)

        temperature_predictions = predictions[:, 0]
        power_predictions = predictions[:, 1]
        humidity_predictions = predictions[:, 2]

        # Generate future timestamps
        last_timestamp = timestamps.iloc[-1]  # Last timestamp from the dataset
        prediction_interval = pd.Timedelta(minutes=5)  # Set interval between predictions
        future_dates = [
            (last_timestamp + i * prediction_interval).strftime('%Y-%m-%d')
            for i in range(1, len(temperature_predictions) + 1)
        ]

        # Return predictions
        return jsonify(
            temperature_predictions=temperature_predictions.tolist(),
            power_predictions=power_predictions.tolist(),
            humidity_predictions=humidity_predictions.tolist(),
            future_dates=future_dates  # Send predicted future dates
        )

    except Exception as e:
        return jsonify(error="Prediction error: " + str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)
