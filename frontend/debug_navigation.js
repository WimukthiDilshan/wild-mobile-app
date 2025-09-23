// Debug script to check navigation state
// Add this to your App.js temporarily to debug navigation

import { NavigationContainer } from '@react-navigation/native';

// Add this logging function to see what's happening
const App = () => {
  return (
    <NavigationContainer
      onStateChange={(state) => {
        console.log('Navigation state changed:', state);
      }}
      onReady={() => {
        console.log('Navigation is ready');
      }}
    >
      {/* Your existing Stack.Navigator */}
    </NavigationContainer>
  );
};