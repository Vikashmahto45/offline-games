import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const NUT_HEIGHT = 20;
const NUT_WIDTH = 50;

const Nut = ({ color, isTop }) => {
    // color is [light, dark] for gradient
    // Hex nut shape: we simulate with rounded corners or specific shapes?
    // Using simple rectangle with gradient looks like side view of a nut.
    // Adding highlights makes it metallic.

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={color}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.nutBody}
            >
                {/* Horizontal Groove/Thread hint */}
                <View style={styles.groove} />
                <View style={styles.highlight} />
            </LinearGradient>

            {/* Thread detail */}
            <View style={styles.innerHole} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: NUT_WIDTH,
        height: NUT_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2, // Space between nuts
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    nutBody: {
        width: '100%',
        height: '100%',
        borderRadius: 4, // Slightly rounded corners for hex appearance from side
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    groove: {
        position: 'absolute',
        top: '50%',
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginTop: -0.5,
    },
    highlight: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: 2,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    innerHole: {
        // Just visual detail
    }
});

export default Nut;
