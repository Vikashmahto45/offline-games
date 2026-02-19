import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const FavoriteScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.subtitle}>Coming Soon!</Text>
            <Text style={styles.description}>
                Your favorite games will appear here
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    icon: {
        fontSize: 80,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.fontSizeXL,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.cardBackground,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.fontSizeLG,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeightBold,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.typography.fontSizeMD,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});

export default FavoriteScreen;
