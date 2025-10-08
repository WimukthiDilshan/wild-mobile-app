import os
import sys
import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder

# Add the models directory to the path to import the training module
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

class SeasonalPredictionService:
    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
        
        self.model_dir = model_dir
        self.models_loaded = False
        
        # Initialize model containers
        self.breeding_model = None
        self.activity_model = None
        self.threat_model = None
        self.behavior_model = None
        self.population_model = None
        
        # Initialize encoders
        self.species_encoder = None
        self.behavior_encoder = None
        self.migration_encoder = None
        self.weather_encoder = None
        
        # Try to load models on initialization
        self.load_models()
    
    def load_models(self):
        """Load all trained models and encoders"""
        try:
            # Load models
            self.breeding_model = joblib.load(os.path.join(self.model_dir, 'breeding_model.pkl'))
            self.activity_model = joblib.load(os.path.join(self.model_dir, 'activity_model.pkl'))
            self.threat_model = joblib.load(os.path.join(self.model_dir, 'threat_model.pkl'))
            self.behavior_model = joblib.load(os.path.join(self.model_dir, 'behavior_model.pkl'))
            self.population_model = joblib.load(os.path.join(self.model_dir, 'population_model.pkl'))
            
            # Load encoders
            self.species_encoder = joblib.load(os.path.join(self.model_dir, 'species_encoder.pkl'))
            self.behavior_encoder = joblib.load(os.path.join(self.model_dir, 'behavior_encoder.pkl'))
            self.migration_encoder = joblib.load(os.path.join(self.model_dir, 'migration_encoder.pkl'))
            self.weather_encoder = joblib.load(os.path.join(self.model_dir, 'weather_encoder.pkl'))
            
            self.models_loaded = True
            print(f"SUCCESS: Models loaded successfully from: {self.model_dir}", file=sys.stderr)
            
        except Exception as e:
            print(f"ERROR: Error loading models: {e}", file=sys.stderr)
            print("Models will need to be trained first.", file=sys.stderr)
            self.models_loaded = False
    
    def prepare_features(self, species, month, migration_tendency=None, weather_preference=None):
        """Prepare features for prediction"""
        if not self.models_loaded:
            raise Exception("Models not loaded. Please train models first.")
        
        # Set defaults
        if migration_tendency is None:
            migration_tendency = 'territorial'
        if weather_preference is None:
            weather_preference = 'moderate'
        
        # Create input data
        input_data = pd.DataFrame({
            'species': [species],
            'month': [month],
            'migration_tendency': [migration_tendency],
            'weather_preference': [weather_preference]
        })
        
        # Encode features
        try:
            input_data['species_encoded'] = self.species_encoder.transform(input_data['species'])
            input_data['migration_encoded'] = self.migration_encoder.transform(input_data['migration_tendency'])
            input_data['weather_encoded'] = self.weather_encoder.transform(input_data['weather_preference'])
        except ValueError as e:
            # Handle unknown species/categories
            print(f"Warning: Unknown category encountered - {e}")
            # Use a default encoded value (first category)
            input_data['species_encoded'] = [0]
            input_data['migration_encoded'] = [0]
            input_data['weather_encoded'] = [0]
        
        # Select feature columns
        feature_columns = ['species_encoded', 'month', 'migration_encoded', 'weather_encoded']
        return input_data[feature_columns]
    
    def predict_seasonal_behavior(self, species, month, migration_tendency=None, weather_preference=None):
        """Predict seasonal behavior for a given species and month"""
        if not self.models_loaded:
            return self._get_fallback_prediction()
        
        try:
            # Prepare features
            X = self.prepare_features(species, month, migration_tendency, weather_preference)
            
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
                'confidence': f'High - AI Model ({avg_confidence:.2%} confidence)',
                'success': True
            }
            
        except Exception as e:
            print(f"ERROR: Prediction error: {e}", file=sys.stderr)
            return self._get_fallback_prediction()
    
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
    
    def _get_fallback_prediction(self):
        """Return fallback prediction when models are not available"""
        return {
            'primaryBehavior': 'normal_activity',
            'breedingSeason': False,
            'breedingPeak': False,
            'activityLevel': 'Normal',
            'threatLevel': 'Low',
            'migrationTendency': 'territorial',
            'populationPeak': False,
            'recommendation': 'Continue regular monitoring',
            'confidence': 'Low - Models not available, using fallback',
            'success': False
        }
    
    def get_supported_species(self):
        """Get list of species supported by the model"""
        if not self.models_loaded:
            return []
        
        try:
            return list(self.species_encoder.classes_)
        except:
            return []
    
    def batch_predict(self, predictions_list):
        """Make batch predictions for multiple species/month combinations"""
        results = []
        for item in predictions_list:
            species = item.get('species')
            month = item.get('month')
            migration = item.get('migration_tendency')
            weather = item.get('weather_preference')
            
            prediction = self.predict_seasonal_behavior(species, month, migration, weather)
            results.append({
                'species': species,
                'month': month,
                'prediction': prediction
            })
        
        return results

# Global service instance
_service_instance = None

def get_prediction_service():
    """Get singleton instance of the prediction service"""
    global _service_instance
    if _service_instance is None:
        _service_instance = SeasonalPredictionService()
    return _service_instance

# Command line interface for API calls
def main():
    """Main function to handle command line arguments"""
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python seasonal_prediction_service.py <command> [args...]")
        print("Commands:")
        print("  predict <species> <month> [migration_tendency] [weather_preference]")
        print("  get_supported_species")
        print("  test")
        return
    
    command = sys.argv[1]
    service = get_prediction_service()
    
    if command == 'predict':
        if len(sys.argv) < 4:
            print(json.dumps({"error": "predict requires species and month arguments"}))
            return
        
        species = sys.argv[2]
        try:
            month = int(sys.argv[3])
        except ValueError:
            print(json.dumps({"error": "month must be a valid integer"}))
            return
        
        migration_tendency = sys.argv[4] if len(sys.argv) > 4 else None
        weather_preference = sys.argv[5] if len(sys.argv) > 5 else None
        
        prediction = service.predict_seasonal_behavior(species, month, migration_tendency, weather_preference)
        print(json.dumps(prediction))
    
    elif command == 'get_supported_species':
        species = service.get_supported_species()
        print(json.dumps(species))
    
    elif command == 'test':
        test_predictions()
    
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))

# Test function
def test_predictions():
    """Test the prediction service"""
    service = get_prediction_service()
    
    if not service.models_loaded:
        print("ERROR: Models not loaded. Please train models first.", file=sys.stderr)
        return
    
    print("TESTING: Seasonal Prediction Service", file=sys.stderr)
    print("=" * 40, file=sys.stderr)
    
    test_cases = [
        ('Tiger', 12),
        ('Elephant', 7),
        ('Leopard', 2),
        ('Rhinoceros', 3),
        ('Giant Panda', 3)
    ]
    
    for species, month in test_cases:
        prediction = service.predict_seasonal_behavior(species, month)
        print(f"\n{species} - Month {month}:", file=sys.stderr)
        print(f"   Behavior: {prediction['primaryBehavior']}", file=sys.stderr)
        print(f"   Breeding: {prediction['breedingSeason']}", file=sys.stderr)
        print(f"   Activity: {prediction['activityLevel']}", file=sys.stderr)
        print(f"   Threat: {prediction['threatLevel']}", file=sys.stderr)
        print(f"   Confidence: {prediction['confidence']}", file=sys.stderr)
    
    print(f"\nSUCCESS: Supported species: {len(service.get_supported_species())}", file=sys.stderr)

if __name__ == "__main__":
    main()