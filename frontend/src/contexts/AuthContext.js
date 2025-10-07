import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import ApiService from '../services/ApiService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // User roles
  const USER_ROLES = {
    VISITOR: 'visitor',
    DRIVER: 'driver', 
    RESEARCHER: 'researcher',
    OFFICER: 'officer',
  };

  // Role permissions
  const ROLE_PERMISSIONS = {
    [USER_ROLES.VISITOR]: {
      canViewAnimals: true,
      canViewPoaching: true,
      canAddAnimals: true,
      canAddPoaching: true,
      canViewAnalytics: true,
      canAccessHome: true,
      canAccessInsertAnimals: true,
      canAccessLogin: true,
      canAccessMain: true,
      canAccessSignUp: true,
      canAccessAnalyst: true,
      canAccessPoachingAnalytics: true,
      canAccessAnimalAnalytics: true,
      canAccessAnimalDetails: true,
      canAddData: true,
      canViewParks: true,
      canAddParks: true,
      canEditParks: true,
      canDeleteParks: true,
      canAccessParkManagement: true,
      canGetPreferences: true,
    },
    [USER_ROLES.DRIVER]: {
      canViewAnimals: true,
      canViewPoaching: true,
      canAddAnimals: true,
      canAddPoaching: true,
      canViewAnalytics: false,
      canAccessHome: true,
      canAccessInsertAnimals: true,
      canAccessLogin: true,
      canAccessMain: true,
      canAccessSignUp: true,
      canAccessAnalyst: false,
      canAccessPoachingAnalytics: false,
      canAccessAnimalAnalytics: false,
      canAccessAnimalDetails: true,
      canAddData: true,
      canViewParks: true,
      canAddParks: false,
      canEditParks: false,
      canDeleteParks: false,
      canAccessParkManagement: true,
    },
    [USER_ROLES.RESEARCHER]: {
      canViewAnimals: true,
      canViewPoaching: true,
      canAddAnimals: true,
      canAddPoaching: true,
      canViewAnalytics: true,
      canAccessHome: true,
      canAccessInsertAnimals: true,
      canAccessLogin: true,
      canAccessMain: true,
      canAccessSignUp: true,
      canAccessAnalyst: true,
      canAccessPoachingAnalytics: true,
      canAccessAnimalAnalytics: true,
      canAccessAnimalDetails: true,
      canAddData: true,
      canViewParks: true,
      canAddParks: true,
      canEditParks: true,
      canDeleteParks: true,
      canAccessParkManagement: true,
    },
    [USER_ROLES.OFFICER]: {
      canViewAnimals: true,
      canViewPoaching: true,
      canAddAnimals: true,
      canAddPoaching: false,
      canViewAnalytics: true,
      canAccessHome: true,
      canAccessInsertAnimals: true,
      canAccessLogin: true,
      canAccessMain: true,
      canAccessSignUp: true,
      canAccessAnalyst: true,
      canAccessPoachingAnalytics: true,
      canAccessAnimalAnalytics: true,
      canAccessAnimalDetails: true,
      canAddData: true,
      canViewParks: true,
      canAddParks: true,
      canEditParks: true,
      canDeleteParks: false,
      canAccessParkManagement: true,
    },
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Fetch user data from Firestore
        try {
          const userDoc = await firestore()
            .collection('users')
            .doc(authUser.uid)
            .get();
          
          if (userDoc.exists) {
            setUserData(userDoc.data());
          }
          
          // Try to get FCM token and persist it on the user's document so backend can send notifications
          try {
            const fcmStatus = await messaging().hasPermission?.();
            // Request permission on iOS if necessary (messaging.requestPermission may be undefined on Android)
            if (messaging().requestPermission) {
              await messaging().requestPermission();
            }
          } catch (permErr) {
            // ignore permission errors; token request may still work on Android
          }

          try {
            const token = await messaging().getToken();
            if (token) {
              try {
                // register token with backend API (authenticated)
                await ApiService.registerDeviceToken(token);
              } catch (regErr) {
                console.debug('Failed to register device token through API, fallback to client-side write:', regErr.message || regErr);
                // fallback: write directly to Firestore so server may still pick it up
                await firestore().collection('users').doc(authUser.uid).set({
                  fcmToken: token,
                  pushToken: token,
                  notificationToken: token,
                  updatedAt: firestore.FieldValue.serverTimestamp()
                }, { merge: true });
              }
            }

            // If user is an officer, subscribe to 'officers' topic (client-side subscription)
            const role = userDoc.exists ? userDoc.data()?.role : null;
            if (role === 'officer') {
              try {
                await messaging().subscribeToTopic('officers');
              } catch (subErr) {
                console.debug('Failed to subscribe to officers topic:', subErr.message || subErr);
              }
            }
            // Foreground message handler
            const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
              console.log('FCM foreground message received:', remoteMessage);
              try {
                const title = remoteMessage?.notification?.title || 'Notification';
                const body = remoteMessage?.notification?.body || JSON.stringify(remoteMessage?.data || {});
                Alert.alert(title, body);
              } catch (e) {
                console.debug('Failed to show alert for foreground message', e);
              }

              // Persist a receipt to Firestore for server-side verification (helps automated tests)
              try {
                await firestore().collection('push_receipts').add({
                  uid: authUser?.uid || null,
                  email: authUser?.email || null,
                  receivedAt: new Date().toISOString(),
                  foreground: true,
                  remoteMessage
                });
              } catch (writeErr) {
                console.debug('Failed to write push receipt to Firestore', writeErr);
              }
            });

            // Handle notification opened from a background state
            const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
              console.log('Notification opened (background):', remoteMessage);
              try {
                await firestore().collection('push_receipts').add({
                  uid: authUser?.uid || null,
                  email: authUser?.email || null,
                  receivedAt: new Date().toISOString(),
                  foreground: false,
                  opened: true,
                  remoteMessage
                });
              } catch (writeErr) {
                console.debug('Failed to write push receipt (opened) to Firestore', writeErr);
              }
              // TODO: navigate to incident details if payload contains incidentId
            });

            // Handle when the app is opened from a quit state by a notification
            messaging().getInitialNotification().then(async remoteMessage => {
              if (remoteMessage) {
                console.log('App opened from quit state by notification:', remoteMessage);
                try {
                  await firestore().collection('push_receipts').add({
                    uid: authUser?.uid || null,
                    email: authUser?.email || null,
                    receivedAt: new Date().toISOString(),
                    foreground: false,
                    opened: true,
                    initialNotification: true,
                    remoteMessage
                  });
                } catch (writeErr) {
                  console.debug('Failed to write push receipt (initial) to Firestore', writeErr);
                }
              }
            }).catch(e => {});
          } catch (tokErr) {
            console.debug('FCM token registration failed:', tokErr.message || tokErr);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, profileData) => {
    try {
      setLoading(true);
      const { user: authUser } = await auth().createUserWithEmailAndPassword(email, password);
      
      // Create user profile in Firestore
      const userProfile = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: profileData.displayName,
        role: profileData.role,
        organization: profileData.organization || '',
        phoneNumber: profileData.phoneNumber || '',
        profileImage: profileData.profileImage || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection('users')
        .doc(authUser.uid)
        .set(userProfile);

      // Update display name in Firebase Auth
      await authUser.updateProfile({
        displayName: profileData.displayName,
      });

      setUserData(userProfile);
      return { success: true, user: authUser };
    } catch (error) {
      console.error('SignUp error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { user: authUser } = await auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: authUser };
    } catch (error) {
      console.error('SignIn error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('SignOut error:', error);
      return { success: false, error: error.message };
    }
  };

  const hasPermission = (permission) => {
    if (!userData || !userData.role) return false;
    return ROLE_PERMISSIONS[userData.role]?.[permission] || false;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [USER_ROLES.VISITOR]: 'Visitor',
      [USER_ROLES.DRIVER]: 'Forest Driver',
      [USER_ROLES.RESEARCHER]: 'Researcher',
      [USER_ROLES.OFFICER]: 'Officer',
    };
    if (roleNames[role]) return roleNames[role];
    // Fallback: convert raw role string to Title Case (e.g. 'park_manager' -> 'Park_manager')
    if (typeof role === 'string' && role.length > 0) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    return 'Unknown';
  };

  const getRoleEmoji = (role) => {
    const roleEmojis = {
      [USER_ROLES.VISITOR]: '👁️',
      [USER_ROLES.DRIVER]: '🚗',
      [USER_ROLES.RESEARCHER]: '🔬',
      [USER_ROLES.OFFICER]: '🛡️',
    };
    return roleEmojis[role] || '👤';
  };

  // Get current user's role permissions
  const rolePermissions = userData?.role ? ROLE_PERMISSIONS[userData.role] : null;

  const value = {
    user,
    userData,
    loading,
    signUp,
    signIn,
    signOut,
    hasPermission,
    getRoleDisplayName,
    getRoleEmoji,
    rolePermissions,
    USER_ROLES,
    ROLE_PERMISSIONS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};