import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const UserHeader = ({ userName, onProfilePress, onSearchPress }) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onProfilePress} style={styles.profileSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{userName}</Text>
            </TouchableOpacity>

            {onSearchPress && (
                <TouchableOpacity onPress={onSearchPress} style={styles.settingsButton}>
                    <View style={styles.settingsIconContainer}>
                        <Text style={styles.settingsIcon}>🔍</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        elevation: 2,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: theme.typography.fontWeightBold,
        color: '#2c2c2e',
    },
    userName: {
        fontSize: theme.typography.fontSizeLG,
        fontWeight: theme.typography.fontWeightBold,
        color: '#2c2c2e',
        flex: 1,
    },
    settingsButton: {
        marginLeft: theme.spacing.sm,
    },
    settingsIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 24,
    },
});

export default UserHeader;
