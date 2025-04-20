import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

# Load stock market data
def load_data(file_path):
    """
    Load stock market data from a CSV file.
    The file should have columns: 'timestamp', 'open', 'high', 'low', 'close', 'volume'.
    """
    try:
        data = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None
    data['timestamp'] = pd.to_datetime(data['timestamp'])
    data.set_index('timestamp', inplace=True)
    return data

# Feature engineering
def create_features(data):
    """
    Create features for the model.
    """
    data['return'] = data['close'].pct_change()
    data['future_return'] = data['return'].shift(-1)
    data['target'] = (data['future_return'] > 0).astype(int)  # 1 for long, 0 for short
    data.dropna(inplace=True)
    return data

# Train model
def train_model(data):
    """
    Train a decision tree classifier on the stock market data.
    """
    X = data[['return']]
    y = data['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = DecisionTreeClassifier()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    return model

# Simulate trading
def simulate_trading(data, model, initial_balance=10):
    """
    Simulate trading based on model predictions.
    """
    balance = initial_balance
    position = 0  # 0 for no position, 1 for long, -1 for short

    for i in range(len(data)):
        current_price = data.iloc[i]['close']
        if i + 1 < len(data):
            next_price = data.iloc[i + 1]['close']
        else:
            break
        features = np.array([[data.iloc[i]['return']]])
        prediction = model.predict(features)[0]

        if prediction == 1:  # Long
            position = balance / current_price
            balance = position * next_price
        elif prediction == 0:  # Short
            position = balance / current_price
            balance = balance + (position * (current_price - next_price))

    print(f"Final Balance: ${balance:.2f}")

    file_path = r'C:\Users\alexa\OneDrive\Documents\Code\Content\sorting-algorithms\Download Data - INDEX_US_S&P US_SPX.csv'
if __name__ == "__main__":
    # Replace 'your_data.csv' with the path to your stock market data file
    # Ensure the CSV file has columns: 'timestamp', 'open', 'high', 'low', 'close', 'volume'
    file_path = 'Download_Data.csv'
    data = load_data(file_path)
    data = create_features(data)
    model = train_model(data)
    simulate_trading(data, model)

