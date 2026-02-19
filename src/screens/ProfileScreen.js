import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { saveUserName } from '../services/storage.service';
import { theme } from '../styles/theme';

const ProfileScreen = ({ route, navigation }) => {
    const { userName: currentName, onNameUpdate } = route.params;
    const [newName, setNewName] = useState(currentName);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async () => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        const saved = await saveUserName(newName.trim());
        if (saved) {
            onNameUpdate(newName.trim());
            setIsEditing(false);
            Alert.alert('Success', 'Name updated successfully!');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Failed to update name');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.avatarSection}>
                <View style={styles.largeAvatar}>
                    <Text style={styles.largeAvatarText}>{newName.charAt(0).toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.label}>Your Name</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.colors.textSecondary}
                        autoFocus
                    />
                ) : (
                    <Text style={styles.nameText}>{newName}</Text>
                )}

                <View style={styles.buttonRow}>
                    {isEditing ? (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.buttonText}>💾 Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => {
                                    setNewName(currentName);
                                    setIsEditing(false);
                                }}
                            >
                                <Text style={styles.buttonText}>❌ Cancel</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.editButton]}
                            onPress={() => setIsEditing(true)}
                        >
                            <Text style={styles.buttonText}>✏️ Edit Name</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
    },
    largeAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    largeAvatarText: {
        fontSize: 60,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.cardBackground,
    },
    infoCard: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSizeSM,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    nameText: {
        fontSize: theme.typography.fontSizeXL,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: '#3a3a3c',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSizeLG,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    button: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: theme.colors.primary,
    },
    saveButton: {
        backgroundColor: '#27ae60',
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        fontSize: theme.typography.fontSizeMD,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.text,
    },
});

export default ProfileScreen;
