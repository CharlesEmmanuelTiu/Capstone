from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:8000"}})
# Load the trained model and scaler
model = tf.keras.models.load_model('temperature_model.h5')
scaler = joblib.load('scaler.pkl')  # Make sure the scaler matches the one used during training

# Define prediction endpoint
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    # Load data from the CSV file
    try:
        # Load the CSV with a different encoding
        input_data = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')
        input_data = input_data[['CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']]
    except FileNotFoundError:
        return jsonify(error="CSV file not found"), 404

    # Ensure the data matches model expectations
    scaled_data = scaler.transform(input_data)

    # Prepare the data for the LSTM model
    seq_length = 10  # Sequence length should match the model's training setup
    X = []
    for i in range(len(scaled_data) - seq_length):
        X.append(scaled_data[i:i + seq_length])

    X = np.array(X)

    # Make predictions
    predicted_temp = model.predict(X)
    predictions = scaler.inverse_transform(predicted_temp)

    # Return the predictions in JSON format
    return jsonify(predictions=predictions.tolist())

if __name__ == '__main__':
    app.run(debug=True)
