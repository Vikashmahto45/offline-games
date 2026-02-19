import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

const TournamentBanner = ({ onSettingsPress }) => {
    return (
        <View style={styles.banner}>
            <View style={styles.content}>
                <Text style={styles.trophy}>🏆</Text>
                <Text style={styles.title}>Play Tournament</Text>
            </View>
            <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        backgroundColor: theme.colors.tournament,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.62,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trophy: {
        fontSize: 32,
        marginRight: theme.spacing.sm,
    },
    title: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeLG,
        fontWeight: theme.typography.fontWeightBold,
    },
    settingsButton: {
        padding: theme.spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
});

export default TournamentBanner;
