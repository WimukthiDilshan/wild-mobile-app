import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import joblib
import os

class SpeciesSeasonalPredictor:
    def __init__(self):
        self.species_encoder = LabelEncoder()
        self.behavior_encoder = LabelEncoder()
        self.migration_encoder = LabelEncoder()
        self.weather_encoder = LabelEncoder()
        
        # Models for different predictions
        self.breeding_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.activity_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.threat_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.behavior_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.population_model = RandomForestClassifier(n_estimators=100, random_state=42)
        
    def prepare_features(self, data, fit_encoders=True):
        """Prepare features for training or prediction"""
        X = data.copy()
        
        if fit_encoders:
            # Fit encoders during training
            X['species_encoded'] = self.species_encoder.fit_transform(X['species'])
            X['migration_encoded'] = self.migration_encoder.fit_transform(X['migration_tendency'])
            X['weather_encoded'] = self.weather_encoder.fit_transform(X['weather_preference'])
        else:
            # Transform during prediction
            X['species_encoded'] = self.species_encoder.transform(X['species'])
            X['migration_encoded'] = self.migration_encoder.transform(X['migration_tendency'])
            X['weather_encoded'] = self.weather_encoder.transform(X['weather_preference'])
        
        # Select features for modeling
        feature_columns = ['species_encoded', 'month', 'migration_encoded', 'weather_encoded']
        return X[feature_columns]
    
    def train(self, csv_path):
        """Train all models using the CSV data"""
        print("Loading training data...")
        data = pd.read_csv(csv_path)
        
        # Prepare features
        X = self.prepare_features(data, fit_encoders=True)
        
        # Prepare targets
        y_breeding = data['breeding_season']
        y_activity = data['activity_level']
        y_threat = data['threat_level']
        y_behavior = self.behavior_encoder.fit_transform(data['primary_behavior'])
        y_population = data['population_peak']
        
        print("Training models...")
        
        # Train breeding season model
        self.breeding_model.fit(X, y_breeding)
        print("✓ Breeding season model trained")
        
        # Train activity level model
        self.activity_model.fit(X, y_activity)
        print("✓ Activity level model trained")
        
        # Train threat level model
        self.threat_model.fit(X, y_threat)
        print("✓ Threat level model trained")
        
        # Train behavior model
        self.behavior_model.fit(X, y_behavior)
        print("✓ Behavior model trained")
        
        # Train population peak model
        self.population_model.fit(X, y_population)
        print("✓ Population peak model trained")
        
        return self
    
    def predict_seasonal_behavior(self, species, month, migration_tendency=None, weather_preference=None):
        """Predict seasonal behavior for a given species and month"""
        # Create input data
        input_data = pd.DataFrame({
            'species': [species],
            'month': [month],
            'migration_tendency': [migration_tendency or 'territorial'],
            'weather_preference': [weather_preference or 'moderate']
        })
        
        try:
            # Prepare features
            X = self.prepare_features(input_data, fit_encoders=False)
            
            # Make predictions
            breeding_season = bool(self.breeding_model.predict(X)[0])
            activity_level = self.activity_model.predict(X)[0]
            threat_level = self.threat_model.predict(X)[0]
            behavior_encoded = self.behavior_model.predict(X)[0]
            population_peak = bool(self.population_model.predict(X)[0])
            
            # Decode behavior
            primary_behavior = self.behavior_encoder.inverse_transform([behavior_encoded])[0]
            
            # Calculate confidence based on model probability
            breeding_prob = self.breeding_model.predict_proba(X)[0].max()
            activity_prob = self.activity_model.predict_proba(X)[0].max()
            threat_prob = self.threat_model.predict_proba(X)[0].max()
            behavior_prob = self.behavior_model.predict_proba(X)[0].max()
            
            avg_confidence = (breeding_prob + activity_prob + threat_prob + behavior_prob) / 4
            
            # Generate recommendation
            recommendation = self._generate_recommendation(
                primary_behavior, activity_level, breeding_season, threat_level
            )
            
            return {
                'primaryBehavior': primary_behavior,
                'breedingSeason': breeding_season,
                'breedingPeak': population_peak and breeding_season,
                'activityLevel': activity_level.title(),
                'threatLevel': threat_level.title(),
                'migrationTendency': migration_tendency or 'territorial',
                'populationPeak': population_peak,
                'recommendation': recommendation,
                'confidence': f'High - AI Model ({avg_confidence:.2%} confidence)'
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fallback to default values
            return {
                'primaryBehavior': 'normal_activity',
                'breedingSeason': False,
                'breedingPeak': False,
                'activityLevel': 'Normal',
                'threatLevel': 'Low',
                'migrationTendency': 'territorial',
                'populationPeak': False,
                'recommendation': 'Continue regular monitoring',
                'confidence': 'Low - Fallback values used'
            }
    
    def _generate_recommendation(self, behavior, activity, breeding, threat):
        """Generate monitoring recommendations based on predictions"""
        if breeding and threat == 'high':
            return 'CRITICAL: Increase monitoring - breeding season with high threat level'
        if breeding:
            return 'Increase monitoring frequency - active breeding season'
        if threat == 'high':
            return 'Enhanced surveillance recommended - high threat period'
        if activity == 'high':
            return 'Optimal time for population surveys and data collection'
        if activity == 'low':
            return 'Reduced monitoring acceptable - natural low activity period'
        return 'Continue standard monitoring protocols'
    
    def save_models(self, model_dir):
        """Save all trained models and encoders"""
        os.makedirs(model_dir, exist_ok=True)
        
        # Save models
        joblib.dump(self.breeding_model, os.path.join(model_dir, 'breeding_model.pkl'))
        joblib.dump(self.activity_model, os.path.join(model_dir, 'activity_model.pkl'))
        joblib.dump(self.threat_model, os.path.join(model_dir, 'threat_model.pkl'))
        joblib.dump(self.behavior_model, os.path.join(model_dir, 'behavior_model.pkl'))
        joblib.dump(self.population_model, os.path.join(model_dir, 'population_model.pkl'))
        
        # Save encoders
        joblib.dump(self.species_encoder, os.path.join(model_dir, 'species_encoder.pkl'))
        joblib.dump(self.behavior_encoder, os.path.join(model_dir, 'behavior_encoder.pkl'))
        joblib.dump(self.migration_encoder, os.path.join(model_dir, 'migration_encoder.pkl'))
        joblib.dump(self.weather_encoder, os.path.join(model_dir, 'weather_encoder.pkl'))
        
        print(f"All models saved to: {model_dir}")
    
    def load_models(self, model_dir):
        """Load all trained models and encoders"""
        # Load models
        self.breeding_model = joblib.load(os.path.join(model_dir, 'breeding_model.pkl'))
        self.activity_model = joblib.load(os.path.join(model_dir, 'activity_model.pkl'))
        self.threat_model = joblib.load(os.path.join(model_dir, 'threat_model.pkl'))
        self.behavior_model = joblib.load(os.path.join(model_dir, 'behavior_model.pkl'))
        self.population_model = joblib.load(os.path.join(model_dir, 'population_model.pkl'))
        
        # Load encoders
        self.species_encoder = joblib.load(os.path.join(model_dir, 'species_encoder.pkl'))
        self.behavior_encoder = joblib.load(os.path.join(model_dir, 'behavior_encoder.pkl'))
        self.migration_encoder = joblib.load(os.path.join(model_dir, 'migration_encoder.pkl'))
        self.weather_encoder = joblib.load(os.path.join(model_dir, 'weather_encoder.pkl'))
        
        print(f"All models loaded from: {model_dir}")
        return self

def main():
    # File paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(BASE_DIR, '..', 'data', 'species_seasonal_patterns.csv')
    model_dir = os.path.join(BASE_DIR, '..', 'trained_models')
    
    print("🐾 Training Species Seasonal Behavior AI Model")
    print("=" * 50)
    
    # Initialize and train the model
    predictor = SpeciesSeasonalPredictor()
    predictor.train(csv_path)
    
    # Save the trained models
    predictor.save_models(model_dir)
    
    print("\n🎯 Testing Model Predictions")
    print("=" * 30)
    
    # Test predictions
    test_cases = [
        ('Tiger', 12),
        ('Elephant', 7),
        ('Leopard', 2),
        ('Rhinoceros', 3),
        ('Giant Panda', 3)
    ]
    
    for species, month in test_cases:
        prediction = predictor.predict_seasonal_behavior(species, month)
        print(f"\n{species} - Month {month}:")
        print(f"  Behavior: {prediction['primaryBehavior']}")
        print(f"  Breeding Season: {prediction['breedingSeason']}")
        print(f"  Activity Level: {prediction['activityLevel']}")
        print(f"  Threat Level: {prediction['threatLevel']}")
        print(f"  Confidence: {prediction['confidence']}")
    
    print(f"\n✅ Model training completed successfully!")
    print(f"📁 Models saved to: {model_dir}")

if __name__ == "__main__":
    main()