import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

# Load and preprocess your data
df = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')
  # Adjust path if necessary

# Scale the data
scaler = MinMaxScaler()
data = scaler.fit_transform(df[['CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']])

# Create sequences for LSTM
def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length, 0])  # Assuming temperature is the target
    return np.array(X), np.array(y)

SEQ_LENGTH = 10
X, y = create_sequences(data, SEQ_LENGTH)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build and compile the LSTM model
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(25),
    Dense(1)
])
model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test))

# Save the model and scaler
model.save('temperature_model.h5')
joblib.dump(scaler, 'scaler.pkl')
