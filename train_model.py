import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

# Define the create_sequences function
def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length, 0])  # Assuming temperature is the target
    return np.array(X), np.array(y)



# Load and preprocess your data
df = pd.read_csv('cpu_monitoring_log.csv', encoding='ISO-8859-1')

# Convert Timestamp column to datetime
df['Timestamp'] = pd.to_datetime(df['Timestamp'])
df['Year'] = df['Timestamp'].dt.year
df['Month'] = df['Timestamp'].dt.month
df['Day'] = df['Timestamp'].dt.day
df['Hour'] = df['Timestamp'].dt.hour
df['Minute'] = df['Timestamp'].dt.minute
df['Second'] = df['Timestamp'].dt.second

# Drop the original Timestamp column as it’s no longer needed
df = df.drop(columns=['Timestamp'])

# Scale the data, now including the new time-related columns
scaler = MinMaxScaler()
data = scaler.fit_transform(df[['CPU Package Temperature (C)', 'CPU Power Consumption (W)', 'Humidity (%)', 
                                'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second']])

# Create sequences for LSTM
SEQ_LENGTH = 10
X, y = create_sequences(data, SEQ_LENGTH)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Build and compile the LSTM model as before
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(25),
    Dense(3)  # Adjust the output layer to 3 for temperature, power, and humidity
])
model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test))

# Save the model and scaler
model.save('temperature_model.h5')
joblib.dump(scaler, 'scaler.pkl')

