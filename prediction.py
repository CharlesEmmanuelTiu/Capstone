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
scaler = joblib.load('scaler.pkl')  # Ensure the scaler matches the one used during training

# Define prediction endpoint
@app.route('/predict', methods=['GET', 'POST'])
def predict():
    # Load data from the CSV file
    try:
        input_data = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')
        
        # Ensure the Timestamp column is in datetime format
        input_data['Timestamp'] = pd.to_datetime(input_data['Timestamp'])

        # Extract datetime components
        input_data['Year'] = input_data['Timestamp'].dt.year
        input_data['Month'] = input_data['Timestamp'].dt.month
        input_data['Day'] = input_data['Timestamp'].dt.day
        input_data['Hour'] = input_data['Timestamp'].dt.hour
        input_data['Minute'] = input_data['Timestamp'].dt.minute
        input_data['Second'] = input_data['Timestamp'].dt.second
        input_data = input_data.drop(columns=['Timestamp'])

    except FileNotFoundError:
        return jsonify(error="CSV file not found"), 404

    # Ensure the data matches model expectations
    try:
        scaled_data = scaler.transform(input_data)
    except ValueError as e:
        return jsonify(error="Data transformation error: " + str(e)), 400

    # Prepare the data for the LSTM model
    seq_length = 10  # Adjust this if your model was trained with a different sequence length
    X = [scaled_data[i:i + seq_length] for i in range(len(scaled_data) - seq_length)]
    X = np.array(X)

    # Make predictions
    predicted_temp = model.predict(X)

    # Prepare the array to match the shape expected by the scaler (1055,9)
    # Place the predicted temperatures in the first column
    predicted_full = np.zeros((predicted_temp.shape[0], 9))  # 9 columns to match scaler
    predicted_full[:, 0] = predicted_temp[:, 0]  # Place predicted temperatures in the first column

    # Inverse transform using the full array, then select only the temperature column
    predictions = scaler.inverse_transform(predicted_full)[:, 0]  # Get only the first column

    # Return the predictions in JSON format
    return jsonify(predictions=predictions.tolist())

if __name__ == '__main__':
    app.run(debug=True)
