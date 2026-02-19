import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Text } from 'react-native';
import { Constants } from './Constants';

export default function Mole({ active, onWhack }) {
    const translateY = useRef(new Animated.Value(Constants.HOLE_SIZE)).current;
    const [isHit, setIsHit] = useState(false);

    useEffect(() => {
        if (active) {
            setIsHit(false); // Reset hit state on new pop up
            // Pop UP
            Animated.spring(translateY, {
                toValue: 0,
                friction: 6,
                tension: 60,
                useNativeDriver: true,
            }).start();
        } else {
            // Pop DOWN
            Animated.timing(translateY, {
                toValue: Constants.HOLE_SIZE,
                duration: 150,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [active]);

    const handlePress = () => {
        if (!isHit && active) {
            setIsHit(true);
            onWhack();
        }
    };

    return (
        <View style={styles.holeContainer}>
            <View style={styles.holeMask}>
                {/* The Mole */}
                <Animated.View
                    style={[
                        styles.mole,
                        { transform: [{ translateY }] }
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.moleTouch, isHit && styles.moleHit]}
                        onPress={handlePress}
                        activeOpacity={1}
                        disabled={!active || isHit}
                    >
                        {/* Mole Face */}
                        <View style={styles.moleFace}>
                            {isHit ? (
                                <>
                                    {/* Hit Face (Dizzy/Pain) */}
                                    <Text style={{ fontSize: 24 }}>😵</Text>
                                </>
                            ) : (
                                <>
                                    {/* Normal Face */}
                                    <View style={styles.eyeLeft} />
                                    <View style={styles.eyeRight} />
                                    <View style={styles.nose} />
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
            {/* The Hole (Visual) */}
            <View style={styles.dirtMound} />

            {/* Hit Effect Popup */}
            {isHit && (
                <View style={styles.hitTextContainer}>
                    <Text style={styles.hitText}>POW!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    holeContainer: {
        width: Constants.HOLE_SIZE,
        height: Constants.HOLE_SIZE + 20,
        alignItems: 'center',
        justifyContent: 'flex-end',
        margin: 10,
    },
    holeMask: {
        width: Constants.HOLE_SIZE,
        height: Constants.HOLE_SIZE,
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        zIndex: 1,
    },
    mole: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    moleTouch: {
        width: '80%',
        height: '90%',
        backgroundColor: '#8d6e63', // Mole brown
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moleHit: {
        backgroundColor: '#ef5350', // Red when hit
    },
    moleFace: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyeLeft: {
        width: 8,
        height: 8,
        backgroundColor: '#000',
        borderRadius: 4,
        position: 'absolute',
        top: 20,
        left: 15,
    },
    eyeRight: {
        width: 8,
        height: 8,
        backgroundColor: '#000',
        borderRadius: 4,
        position: 'absolute',
        top: 20,
        right: 15,
    },
    nose: {
        width: 12,
        height: 8,
        backgroundColor: '#3e2723', // Dark brown nose
        borderRadius: 6,
        position: 'absolute',
        top: 35,
    },
    dirtMound: {
        width: '100%',
        height: 30,
        backgroundColor: '#3e2723', // Dark dirt
        borderRadius: 15, // Oval shape
        transform: [{ scaleX: 1.2 }],
        zIndex: 2, // In front of mole bottom
        marginTop: -15,
    },
    hitTextContainer: {
        position: 'absolute',
        top: -10,
        zIndex: 10,
    },
    hitText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'yellow',
        textShadowColor: 'red',
        textShadowRadius: 2,
    }
});
