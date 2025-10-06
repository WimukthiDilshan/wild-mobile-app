import sys, json, os, joblib, pandas as pd
import numpy as np

# Fixed feature order
FEATURE_ORDER = [
    "mammals", "birds", "reptiles", "amphibians", "insects" ,
    "safari", "camping", "birdwatching", "hiking",
    "forest", "wetland", "mountain", "coastal",
    "family", "adventure", "relaxation"
]

# Load trained Random Forest model
BASE_DIR = os.path.dirname(__file__)
model_path = os.path.join(BASE_DIR, "wildpark_recommender.pkl")
model = joblib.load(model_path)

# Handle input
try:
    if len(sys.argv) > 1:
        user_features = json.loads(sys.argv[1])
    else:
        raise ValueError("No JSON input provided")
except Exception as e:
    print(json.dumps({"error": f"Invalid input: {e}"}))
    sys.exit(0)

# Ensure feature order matches model training
input_vector = [user_features.get(feature, 0) for feature in FEATURE_ORDER]
input_df = pd.DataFrame([input_vector], columns=FEATURE_ORDER)

# Predict probabilities
probs = model.predict_proba(input_df)[0]
classes = model.classes_

# Top 3 recommendations
top_indices = probs.argsort()[-3:][::-1]
recommendations = [{"park": classes[i], "score": float(probs[i])} for i in top_indices]

print(json.dumps(recommendations))
