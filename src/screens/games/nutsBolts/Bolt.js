import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Nut from './Nut';

const BOLT_HEIGHT = 120;
const BOLT_WIDTH = 12;
const BASE_WIDTH = 56;

const Bolt = ({ nuts, isSelected, onPress, capacity = 4, index }) => {
    const liftAnim = useRef(new Animated.Value(0)).current; // For lifting visual when selected

    useEffect(() => {
        Animated.timing(liftAnim, {
            toValue: isSelected ? -10 : 0, // Lift up slightly
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isSelected]);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress(index)}
            style={styles.touchable}
        >
            <View style={styles.container}>
                {/* Bolt Rod (Background) */}
                <LinearGradient
                    colors={['#9CA3AF', '#D1D5DB', '#6B7280']} // Metallic Grey
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.rod}
                >
                    {/* Threads logic visual */}
                    <View style={styles.threads} />
                </LinearGradient>

                {/* Nuts Stack */}
                <Animated.View style={[
                    styles.nutsContainer,
                    { transform: [{ translateY: liftAnim }] }
                ]}>
                    {/* Render Nuts from bottom up logic, but visually we stack them. */}
                    {/* Array is [bottom, ..., top]. Flex column-reverse does bottom up. */}
                    {/* But Standard Flex column is top down. 
                        Let's render top to bottom in logic, but standard mapping.
                        Actually, Water Sort usually renders bottom=index0.
                        Let's use column-reverse for container.
                    */}
                    {nuts.map((color, i) => (
                        <Nut key={i} color={color} />
                    ))}
                </Animated.View>

                {/* Base Plate */}
                <LinearGradient
                    colors={['#4B5563', '#9CA3AF', '#374151']}
                    style={styles.base}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchable: {
        margin: 8,
        alignItems: 'center',
    },
    container: {
        height: BOLT_HEIGHT,
        width: BASE_WIDTH,
        alignItems: 'center',
        justifyContent: 'flex-end', // Align base at bottom
    },
    rod: {
        position: 'absolute',
        top: 10,
        bottom: 10, // Sit on base
        width: BOLT_WIDTH,
        borderRadius: 4,
        zIndex: 0,
    },
    threads: {
        // Optional thread lines
    },
    base: {
        width: BASE_WIDTH,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#374151',
        zIndex: 1,
    },
    nutsContainer: {
        width: BASE_WIDTH,
        position: 'absolute',
        bottom: 14, // Above base
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'column-reverse', // Index 0 at bottom
        zIndex: 2,
    },
});

export default Bolt;
