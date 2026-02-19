import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { saveUserName } from '../services/storage.service';
import { theme } from '../styles/theme';

const EntryScreen = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handlePlay = async () => {
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        const saved = await saveUserName(name.trim());
        if (saved) {
            onComplete(name.trim());
        } else {
            setError('Error saving name. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.logo}>🎮</Text>
                <Text style={styles.title}>Offline Games</Text>
                <Text style={styles.subtitle}>Enter your name to get started</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        setError('');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handlePlay}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Play</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSizeXL,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.cardBackground,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.fontSizeMD,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSizeMD,
        borderWidth: 2,
        borderColor: theme.colors.cardBorder,
        marginBottom: theme.spacing.md,
    },
    error: {
        color: '#e74c3c',
        fontSize: theme.typography.fontSizeSM,
        marginBottom: theme.spacing.sm,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xxl,
        borderRadius: theme.borderRadius.lg,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: theme.spacing.md,
    },
    buttonText: {
        color: theme.colors.cardBackground,
        fontSize: theme.typography.fontSizeLG,
        fontWeight: theme.typography.fontWeightBold,
        textAlign: 'center',
    },
});

export default EntryScreen;
