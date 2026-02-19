import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

const GameCard = ({ title, icon, onPress, gradient }) => {
    return (
        <View style={styles.wrapper}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
                <LinearGradient
                    colors={gradient || ['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <Text style={styles.icon}>{icon}</Text>
                </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    container: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    gradient: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.lg,
    },
    icon: {
        fontSize: 70,
    },
    title: {
        fontSize: theme.typography.fontSizeMD,
        fontWeight: theme.typography.fontWeightBold,
        color: '#2C2C2E',
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
});

export default GameCard;
