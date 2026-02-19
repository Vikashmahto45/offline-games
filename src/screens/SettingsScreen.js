import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { saveSettings, getSettings } from '../services/storage.service';

import { theme } from '../styles/theme';
import UserHeader from '../components/UserHeader';

const SettingsScreen = ({ navigation, userName, onNameUpdate }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getSettings();
        setSoundEnabled(settings.soundEnabled);
        setVibrationEnabled(settings.vibrationEnabled);
        setLoading(false);
    };

    const updateSettings = async (newSettings) => {
        const settings = {
            soundEnabled,
            vibrationEnabled,
            ...newSettings,
        };
        await saveSettings(settings);
    };

    const handleSoundToggle = (value) => {
        setSoundEnabled(value);
        updateSettings({ soundEnabled: value });
    };

    const handleVibrationToggle = (value) => {
        setVibrationEnabled(value);
        updateSettings({ vibrationEnabled: value });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
                <UserHeader
                    userName={userName || 'Guest'}
                    onProfilePress={() => navigation.navigate('Profile', { userName, onNameUpdate })}
                />
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>

                {/* Sound Setting */}

                {/* Sound Setting */}
                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingHeader}>
                            <Text style={styles.settingIcon}>🔊</Text>
                            <Text style={styles.settingTitle}>Sound</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={handleSoundToggle}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={soundEnabled ? theme.colors.text : '#f4f3f4'}
                        />
                    </View>
                    <Text style={styles.settingDescription}>
                        {soundEnabled ? 'Sound effects enabled' : 'Sound effects disabled'}
                    </Text>
                </View>

                {/* Language Removed */}

                {/* Vibration Setting */}
                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingHeader}>
                            <Text style={styles.settingIcon}>📳</Text>
                            <Text style={styles.settingTitle}>Vibration</Text>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={handleVibrationToggle}
                            trackColor={{ false: '#767577', true: theme.colors.primary }}
                            thumbColor={vibrationEnabled ? theme.colors.text : '#f4f3f4'}
                        />
                    </View>
                    <Text style={styles.settingDescription}>
                        {vibrationEnabled ? 'Haptic feedback enabled' : 'Haptic feedback disabled'}
                    </Text>
                </View>

                <Text style={styles.footer}>✅ All settings are saved automatically</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeLG,
    },
    loadingText: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeLG,
    },
    // title: {
    //     fontSize: theme.typography.fontSizeXL,
    //     fontWeight: theme.typography.fontWeightBold,
    //     color: theme.colors.cardBackground,
    //     marginBottom: theme.spacing.lg,
    //     textAlign: 'center',
    // },
    settingCard: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.cardBorder,
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingIcon: {
        fontSize: 24,
        marginRight: theme.spacing.sm,
    },
    settingTitle: {
        fontSize: theme.typography.fontSizeLG,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.text,
    },
    settingDescription: {
        fontSize: theme.typography.fontSizeSM,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    optionButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#3a3a3c',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.secondary,
    },
    optionText: {
        fontSize: theme.typography.fontSizeMD,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.fontWeightSemiBold,
    },
    optionTextActive: {
        color: theme.colors.cardBackground,
        fontWeight: theme.typography.fontWeightBold,
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    languageButton: {
        width: '48%',
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#3a3a3c',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.secondary,
    },
    languageText: {
        fontSize: theme.typography.fontSizeMD,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.fontWeightSemiBold,
    },
    languageTextActive: {
        color: theme.colors.cardBackground,
        fontWeight: theme.typography.fontWeightBold,
    },
    footer: {
        textAlign: 'center',
        color: theme.colors.primary,
        fontSize: theme.typography.fontSizeSM,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        fontWeight: theme.typography.fontWeightBold,
    },
});

export default SettingsScreen;
