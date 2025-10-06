import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# 1️⃣ Set file paths
BASE_DIR = os.path.dirname(__file__)
csv_path = os.path.join(BASE_DIR, "parks.csv")
model_path = os.path.join(BASE_DIR, "wildpark_recommender.pkl")

# 2️⃣ Load dataset
print("Loading dataset...")
data = pd.read_csv(csv_path)

# 3️⃣ Prepare features and target
X = data.drop('park_name', axis=1)
y = data['park_name']

# 4️⃣ Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5️⃣ Train Random Forest model
print("Training model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 6️⃣ Save trained model
joblib.dump(model, model_path)
print(f"Model trained and saved at: {model_path}")