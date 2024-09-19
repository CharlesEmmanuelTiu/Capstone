from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
from stable_baselines3 import PPO
from stable_baselines3.common.envs import DummyVecEnv
import numpy as np

app = Flask(__name__)

# Placeholder for models
regression_model = LinearRegression()
reinforcement_model = None  # This will be created later

# Function to train the reinforcement learning model
def train_rl_model(data):
    class CustomEnv:
        def __init__(self, data):
            self.data = data
            self.current_step = 0

        def reset(self):
            self.current_step = 0
            return self._get_observation()

        def _get_observation(self):
            return np.array(self.data[self.current_step])

        def step(self, action):
            self.current_step += 1
            done = self.current_step >= len(self.data)
            reward = -np.abs(action - self.data[self.current_step][-1])  # Reward is based on error minimization
            return self._get_observation(), reward, done, {}

    # Train a reinforcement learning model
    env = DummyVecEnv([lambda: CustomEnv(data)])
    model = PPO("MlpPolicy", env, verbose=1)
    model.learn(total_timesteps=10000)
    return model

# Function to train the models
def train_models(csv_file):
    data = pd.read_csv(csv_file)
    # Select relevant columns
    data = data[['datetime', 'temperature', 'humidity', 'power']]

    # Preprocess data (converting datetime and scaling features could go here)
    X = data[['temperature', 'humidity']]
    y = data['power']

    # Train regression model
    regression_model.fit(X, y)

    # Train reinforcement learning model
    rl_data = data[['temperature', 'humidity', 'power']].values
    global reinforcement_model
    reinforcement_model = train_rl_model(rl_data)

@app.route('/train', methods=['POST'])
def train():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    csv_file = request.files['file']
    train_models(csv_file)
    return jsonify({"message": "Models trained successfully"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Assuming data is provided as JSON
    temp = data.get("temperature")
    hum = data.get("humidity")
    
    if temp is None or hum is None:
        return jsonify({"error": "Missing temperature or humidity in the input"}), 400

    # Make a prediction using regression model
    reg_pred = regression_model.predict([[temp, hum]])[0]

    # Reinforcement learning model prediction (using a dummy action here)
    if reinforcement_model is not None:
        rl_pred = reinforcement_model.predict(np.array([[temp, hum]]))[0]
    else:
        rl_pred = "Reinforcement model not trained"

    return jsonify({
        "regression_prediction": reg_pred,
        "reinforcement_prediction": rl_pred
    })

if __name__ == '__main__':
    app.run(port=5000)
