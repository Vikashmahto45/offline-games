import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TUBE_HEIGHT = 180;
const TUBE_WIDTH = 48;
const LAYER_HEIGHT = 170 / 4; // Slightly less than full height to leave room for bottom curve

const Tube = ({ tube, isSelected, onPress, index, onLayout, isHidden }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (isSelected) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [isSelected]);

    const renderWaterLayer = (color, layerIndex) => {
        // Handle both simple strings and gradient arrays
        if (!color) return null;
        const colors = Array.isArray(color) ? color : [color, color];

        return (
            <LinearGradient
                key={layerIndex}
                colors={colors}
                style={[
                    styles.waterLayer,
                    { height: LAYER_HEIGHT },
                ]}
            />
        );
    };

    const renderEmptyLayers = () => {
        const emptyCount = 4 - tube.length;
        return Array.from({ length: emptyCount }, (_, i) => (
            <View
                key={`empty-${i}`}
                style={[
                    styles.waterLayer,
                    {
                        backgroundColor: 'transparent',
                        height: LAYER_HEIGHT,
                    },
                ]}
            />
        ));
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPress(index)}
            onLayout={(event) => {
                if (onLayout) {
                    onLayout(index, event.nativeEvent.layout);
                }
            }}
        >
            <Animated.View
                style={[
                    styles.tubeContainer,
                    isSelected && styles.selectedTube,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: isHidden ? 0 : 1, // Hide if being animated externally
                    },
                ]}
            >
                <View style={styles.tubeWrapper}>
                    {/* Glass Tube Body */}
                    <View style={styles.tube}>
                        {/* Empty layers on top */}
                        {renderEmptyLayers()}

                        {/* Water layers from top to bottom (reversed for visual) */}
                        {tube.slice().reverse().map((color, i) =>
                            renderWaterLayer(color, i)
                        )}

                        {/* Glossy Overlay */}
                        <View style={styles.gloss} />
                    </View>

                    {/* Tube Rim */}
                    <View style={styles.rim} />
                </View>

                {/* Tube number label */}
                <Text style={styles.tubeLabel}>{index + 1}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    tubeContainer: {
        alignItems: 'center',
        marginHorizontal: 6,
    },
    selectedTube: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    tubeWrapper: {
        position: 'relative',
        alignItems: 'center',
    },
    tube: {
        width: TUBE_WIDTH,
        height: TUBE_HEIGHT,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderTopWidth: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 5, // Space for rim
    },
    rim: {
        position: 'absolute',
        top: 0,
        width: TUBE_WIDTH + 6,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    waterLayer: {
        width: '100%',
    },
    gloss: {
        position: 'absolute',
        left: 4,
        top: 4,
        bottom: 24,
        width: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tubeLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },
});

export default Tube;
