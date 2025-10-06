import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
    };
    return roleNames[role] || 'Unknown';
  };

  const getRoleEmoji = (role) => {
    const roleEmojis = {
      [USER_ROLES.VISITOR]: '👁️',
      [USER_ROLES.DRIVER]: '🚗',
      [USER_ROLES.RESEARCHER]: '🔬',
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