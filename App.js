
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getUserName } from './src/services/storage.service';
import EntryScreen from './src/screens/EntryScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { theme } from './src/styles/theme';

// Context removed

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState(null);

    // Check if user name is already saved on app start
    useEffect(() => {
        checkUserName();
    }, []);

    const checkUserName = async () => {
        try {
            const savedName = await getUserName();
            setUserName(savedName);
        } catch (error) {
            console.error('Error checking user name:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEntryComplete = (name) => {
        setUserName(name);
    };

    const handleNameUpdate = (newName) => {
        setUserName(newName);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <NavigationContainer theme={theme}>
                {userName ? (
                    <MainNavigator userName={userName} onNameUpdate={handleNameUpdate} />
                ) : (
                    <EntryScreen onUserSet={handleEntryComplete} />
                )}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
