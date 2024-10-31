from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib

app = Flask(__name__)
CORS(app ,origins=['http://127.0.0.1:8000'])  # Enable CORS for all routes

# Load the trained model and scaler
model = tf.keras.models.load_model('temperature_model.h5')
scaler = joblib.load('scaler.pkl')  # Ensure the scaler is loaded correctly

# Define prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    print(data)
    input_data = pd.DataFrame(data)
    scaled_data = scaler.transform(input_data)
    if data:  # Check if data exists
        input_data = pd.DataFrame(data)
        # ... rest of your code
    else:
        # Handle empty data case (e.g., return an error message)
        return jsonify(error="Empty data received")
    # Preprocess and make predictions
    seq_length = 10
    X = []
    for i in range(len(scaled_data) - seq_length):
        X.append(scaled_data[i:i + seq_length])

    X = np.array(X)
    predicted_temp = model.predict(X)
    predictions = scaler.inverse_transform(predicted_temp)

    return jsonify(predictions=predictions.tolist())

if __name__ == '__main__':
    app.run(debug=True)
