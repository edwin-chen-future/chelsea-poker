import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from './src/contexts/AuthContext';
import { SessionsScreen } from './src/screens/SessionsScreen';
import { AddSessionScreen } from './src/screens/AddSessionScreen';
import { ChartsScreen } from './src/screens/ChartsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { colors } from './src/constants';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            tabBarStyle: {
              backgroundColor: colors.tabBar,
              borderTopColor: colors.separator,
              paddingBottom: 12,
              height: 72,
            },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
          }}
        >
          <Tab.Screen
            name="Sessions"
            component={SessionsScreen}
            options={({ navigation }) => ({
              title: 'Sessions',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list" color={color} size={size} />
              ),
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Add Session')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons name="add-circle" size={28} color={colors.accent} />
                </TouchableOpacity>
              ),
            })}
          />
          <Tab.Screen
            name="Charts"
            component={ChartsScreen}
            options={{
              title: 'Charts',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Add Session"
            component={AddSessionScreen}
            options={({ navigation }) => ({
              title: 'Add Session',
              tabBarButton: () => null,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Sessions')}
                  style={{ marginLeft: 16 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={28} color={colors.accent} />
                </TouchableOpacity>
              ),
            })}
          />
          <Tab.Screen
            name="Edit Session"
            component={AddSessionScreen}
            options={({ navigation }) => ({
              title: 'Edit Session',
              tabBarButton: () => null,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Sessions')}
                  style={{ marginLeft: 16 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={28} color={colors.accent} />
                </TouchableOpacity>
              ),
            })}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
