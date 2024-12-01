import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length, :3])  # Targets: temp, power, humidity
    return np.array(X), np.array(y)

# Load and preprocess your data
df = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')
df = df[['Timestamp', 'CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']]
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df['Year'] = df['Timestamp'].dt.year
df['Month'] = df['Timestamp'].dt.month
df['Day'] = df['Timestamp'].dt.day
df['Hour'] = df['Timestamp'].dt.hour
df['Minute'] = df['Timestamp'].dt.minute
df['Second'] = df['Timestamp'].dt.second
df = df.drop(columns=['Timestamp'])

# Scale the features
scaler = MinMaxScaler()
features = scaler.fit_transform(df[['CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)',
                                   'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second']])
joblib.dump(scaler, 'scaler.pkl')  # Save feature scaler

# Scale the target variables separately
target_scaler = MinMaxScaler()
targets = target_scaler.fit_transform(df[['CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)']])
joblib.dump(target_scaler, 'target_scaler.pkl')  # Save target scaler

# Create sequences for LSTM
SEQ_LENGTH = 10
X, y = create_sequences(features, SEQ_LENGTH)
y = targets[SEQ_LENGTH:]  # Align targets with sequences

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build and compile the LSTM model
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(25),
    Dense(3)  # Output layer for temp, power, humidity
])
model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model with early stopping
from tensorflow.keras.callbacks import EarlyStopping
early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stopping])

# Save the model
model.save('temperature_model.h5')
