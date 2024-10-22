# Import necessary libraries
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# Example Data (Replace this with actual temperature and feature data)
# Here we assume df has columns: 'temperature', 'feature1', 'feature2', ..., 'label' (overheat: 0 or 1)
df = pd.read_csv('temperature_data.csv')

# Preprocessing
# Scale the data to normalize the features
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df.drop('label', axis=1))

# Create input sequences and labels
def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length, 0])  # Assuming temperature is the first column
    return np.array(X), np.array(y)

SEQ_LENGTH = 10  # The length of the sequence for time-series prediction
X, y = create_sequences(scaled_data, SEQ_LENGTH)

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Building the LSTM model
model = Sequential()
model.add(LSTM(units=50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])))
model.add(Dropout(0.2))  # Prevent overfitting
model.add(LSTM(units=50, return_sequences=False))
model.add(Dropout(0.2))
model.add(Dense(units=25))
model.add(Dense(units=1))  # Output layer for temperature prediction

# Compile the model
model.compile(optimizer='adam', loss='mean_squared_error')

# Train the model
history = model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test))

# Predicting temperature and detecting overheating
predicted_temp = model.predict(X_test)
predicted_overheat = predicted_temp > threshold_temp  # Define an overheat threshold

# Evaluate the model
mse = model.evaluate(X_test, y_test)
print(f"Mean Squared Error: {mse}")

# You can adjust threshold_temp based on your domain knowledge or historical data.