import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChallengeScreen from '../screens/ChallengeScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LudoScreen from '../screens/games/LudoScreen';
import SnakeScreen from '../screens/games/SnakeScreen';


import WaterSortScreen from '../screens/games/WaterSortScreen';
import NutsBoltsScreen from '../screens/games/NutsBoltsScreen';

import WhacAMoleScreen from '../screens/games/WhacAMoleScreen';
import DinoRunScreen from '../screens/games/DinoRunScreen';
import BrickBreakerScreen from '../screens/games/BrickBreakerScreen';
import TetrisScreen from '../screens/games/TetrisScreen';
import TempleRunScreen from '../screens/games/TempleRunScreen';
import FlappyBirdScreen from '../screens/games/FlappyBirdScreen';
import SudokuScreen from '../screens/games/SudokuScreen';


import { theme } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = ({ userName, onNameUpdate }) => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.cardBackground,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="HomeMain"
                options={{ headerShown: false }}
            >
                {(props) => <HomeScreen {...props} userName={userName} onNameUpdate={onNameUpdate} />}
            </Stack.Screen>
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: '👤 My Profile' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: '⚙️ Settings' }}
            />
            <Stack.Screen
                name="Ludo"
                component={LudoScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Snake"
                component={SnakeScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="WaterSort"
                component={WaterSortScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NutsBolts"
                component={NutsBoltsScreen}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="WhacAMole"
                component={WhacAMoleScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DinoRun"
                component={DinoRunScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="BrickBreaker"
                component={BrickBreakerScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Tetris"
                component={TetrisScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TempleRun"
                component={TempleRunScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="FlappyBird"
                component={FlappyBirdScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Sudoku"
                component={SudokuScreen}
                options={{ headerShown: false }}
            />


        </Stack.Navigator>
    );
};

const MainNavigator = ({ userName, onNameUpdate }) => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.cardBackground,
                    borderTopColor: theme.colors.cardBorder,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.cardBackground,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
                    headerShown: false,
                }}
            >
                {(props) => <HomeStack {...props} userName={userName} onNameUpdate={onNameUpdate} />}
            </Tab.Screen>
            <Tab.Screen
                name="Challenge"
                component={ChallengeScreen}
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trophy" size={24} color={color} />,
                }}
            />

            <Tab.Screen
                name="Settings"
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
                    headerShown: false,
                }}
            >
                {(props) => <SettingsScreen {...props} userName={userName} onNameUpdate={onNameUpdate} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

export default MainNavigator;
