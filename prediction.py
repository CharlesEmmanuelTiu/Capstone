from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:8000", "http://localhost:8000"]}})

# Load the trained model and scaler
model = tf.keras.models.load_model('temperature_model.h5')  # Use the updated model name if changed
scaler = joblib.load('scaler.pkl')  # Ensure the scaler matches the one used during training

# Define the sequence length used during training
SEQ_LENGTH = 10  # Match this with the value used in training

# Define prediction endpoint
@app.route('/predict', methods=['GET', 'POST'])
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    try:
        # Load and preprocess input data
        input_data = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')
        input_data = input_data.dropna()

        # Debug: Check column names
        print("Columns in the CSV:", input_data.columns)

        # Ensure the Timestamp column exists
        if 'Timestamp' not in input_data.columns:
            return jsonify(error="Timestamp column not found in the CSV"), 400

        # Convert the Timestamp column to datetime
        input_data['Timestamp'] = pd.to_datetime(input_data['Timestamp'], errors='coerce')
        if input_data['Timestamp'].isna().all():
            return jsonify(error="Invalid Timestamp data"), 400

        # Save a copy of the Timestamp column for later use
        timestamp_column = input_data['Timestamp'].copy()

        # Extract datetime components
        input_data['Year'] = input_data['Timestamp'].dt.year
        input_data['Month'] = input_data['Timestamp'].dt.month
        input_data['Day'] = input_data['Timestamp'].dt.day
        input_data['Hour'] = input_data['Timestamp'].dt.hour
        input_data['Minute'] = input_data['Timestamp'].dt.minute
        input_data['Second'] = input_data['Timestamp'].dt.second

        # Drop the Timestamp column after processing
        input_data = input_data.drop(columns=['Timestamp'])

    except FileNotFoundError:
        return jsonify(error="CSV file not found"), 404

    try:
        # Scale the input data
        scaled_data = scaler.transform(input_data)
    except ValueError as e:
        return jsonify(error="Data transformation error: " + str(e)), 400

    # Ensure enough data for sequence generation
    if len(scaled_data) < SEQ_LENGTH:
        return jsonify(error="Not enough data to generate sequences"), 400

    # Prepare the data for the LSTM model
    X = [scaled_data[i:i + SEQ_LENGTH] for i in range(len(scaled_data) - SEQ_LENGTH)]
    X = np.array(X)

    # Make predictions
    predicted_metrics = model.predict(X)  # Outputs shape: (num_samples, 3)

    # Prepare a full array to match scaler dimensions
    predicted_full = np.zeros((predicted_metrics.shape[0], scaled_data.shape[1]))
    predicted_full[:, :3] = predicted_metrics  # Place predictions in the first 3 columns

    # Inverse transform to get original scale values
    predictions = scaler.inverse_transform(predicted_full)

    # Extract individual predictions
    temperature_predictions = predictions[:, 0]
    power_predictions = predictions[:, 1]
    humidity_predictions = predictions[:, 2]

    # Generate time labels for the predictions
    time_labels = timestamp_column.iloc[-len(temperature_predictions):].dt.strftime('%H:%M:%S').tolist()

    # Return predictions as JSON
    return jsonify(
        temperature_predictions=temperature_predictions.tolist(),
        power_predictions=power_predictions.tolist(),
        humidity_predictions=humidity_predictions.tolist(),
        time_labels=time_labels
    )


if __name__ == '__main__':
    app.run(debug=True)
