import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Screens
import MainScreen from './src/screens/MainScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnalystScreen from './src/screens/AnalystScreen';
import AnimalDetailsScreen from './src/screens/AnimalDetailsScreen';
import AnimalAnalyticsScreen from './src/screens/AnimalAnalyticsScreen';
import InsertAnimalsScreen from './src/screens/InsertAnimalsScreen';
import PoachingAnalyticsScreen from './src/screens/PoachingAnalyticsScreen';
import AddPoachingScreen from './src/screens/AddPoachingScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen 
            name="Main" 
            component={MainScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: '🌲 Forest Monitor' }}
          />
          <Stack.Screen 
            name="Analyst" 
            component={AnalystScreen} 
            options={{ title: '📊 Analytics Dashboard' }}
          />
          <Stack.Screen 
            name="AnimalDetails" 
            component={AnimalDetailsScreen} 
            options={{ title: '🦁 Animal Details' }}
          />
          <Stack.Screen 
            name="AnimalAnalytics" 
            component={AnimalAnalyticsScreen} 
            options={{ title: '📊 Animal Analytics' }}
          />
          <Stack.Screen 
            name="InsertAnimals" 
            component={InsertAnimalsScreen} 
            options={{ title: '🦁 Insert Animals' }}
          />
          <Stack.Screen 
            name="PoachingAnalytics" 
            component={PoachingAnalyticsScreen} 
            options={{ title: '�️ Poaching Analytics' }}
          />
          <Stack.Screen 
            name="AddPoaching" 
            component={AddPoachingScreen} 
            options={{ title: '🚨 Report Poaching' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;