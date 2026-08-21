import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EntriesProvider } from './src/context/EntriesContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { AdvisorScreen } from './src/screens/AdvisorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AddEntryScreen } from './src/screens/AddEntryScreen';
import { RootStackParamList, TabParamList } from './src/navigation/types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Dashboard: '🏠',
  History: '🗓️',
  Stats: '📊',
  Advisor: '🤖',
  Settings: '⚙️',
};

const TAB_TITLES: Record<keyof TabParamList, string> = {
  Dashboard: 'Дашборд',
  History: 'История',
  Stats: 'Статистика',
  Advisor: 'Советник',
  Settings: 'Настройки',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitle: TAB_TITLES[route.name as keyof TabParamList],
        tabBarLabel: TAB_TITLES[route.name as keyof TabParamList],
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name as keyof TabParamList]}</Text>,
        tabBarActiveTintColor: '#1C1C1E',
        tabBarInactiveTintColor: '#B0B0B5',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Advisor" component={AdvisorScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <EntriesProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="AddEntry"
              component={AddEntryScreen}
              options={{ presentation: 'modal', title: 'Новая запись' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </EntriesProvider>
    </SafeAreaProvider>
  );
}
