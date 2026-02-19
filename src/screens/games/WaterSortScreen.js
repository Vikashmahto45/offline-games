import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, UIManager, LayoutAnimation, Animated, Dimensions, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import Tube from './waterSort/Tube';
import {
    generatePuzzle,
    performPour,
    checkWin,
    canPour,
} from './waterSort/puzzleGenerator';

// Enable LayoutAnimation for Android
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
// }

const STREAM_WIDTH = 6;

const WaterSortScreen = ({ navigation }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [difficulty, setDifficulty] = useState(null);
    const [tubes, setTubes] = useState([]);
    const [selectedTube, setSelectedTube] = useState(null);
    const [moves, setMoves] = useState(0);
    const [moveHistory, setMoveHistory] = useState([]);

    // Animation State
    const [isPouring, setIsPouring] = useState(false);
    const [pouringFromIndex, setPouringFromIndex] = useState(null);
    const [pouringToLayout, setPouringToLayout] = useState(null);

    // Layouts
    const tubeLayouts = useRef({});
    const scrollRef = useRef(null);

    // Animated Values for Pouring Tube
    const pourAnimX = useRef(new Animated.Value(0)).current;
    const pourAnimY = useRef(new Animated.Value(0)).current;
    const pourRotation = useRef(new Animated.Value(0)).current;
    const streamOpacity = useRef(new Animated.Value(0)).current;

    const handleStartGame = (selectedDifficulty) => {
        setDifficulty(selectedDifficulty);
        const newPuzzle = generatePuzzle(selectedDifficulty);
        setTubes(newPuzzle);
        setSelectedTube(null);
        setMoves(0);
        setMoveHistory([]);
        setGameStarted(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleTubePress = (index) => {
        if (isPouring) return; // Prevent interaction during animation

        if (selectedTube === null) {
            if (tubes[index].length > 0) {
                setSelectedTube(index);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } else {
            if (selectedTube === index) {
                setSelectedTube(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                tryPour(selectedTube, index);
            }
        }
    };

    const tryPour = (fromIndex, toIndex) => {
        const fromTube = tubes[fromIndex];
        const toTube = tubes[toIndex];

        if (canPour(fromTube, toTube)) {
            // Start Pour Animation Sequence
            performPourAnimation(fromIndex, toIndex);
        } else {
            setSelectedTube(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const performPourAnimation = (fromIndex, toIndex) => {
        const fromLayout = tubeLayouts.current[fromIndex];
        const toLayout = tubeLayouts.current[toIndex];

        if (!fromLayout || !toLayout) {
            // Fallback if layouts missing (shouldn't happen)
            finishPour(fromIndex, toIndex);
            return;
        }

        setIsPouring(true);
        setPouringFromIndex(fromIndex);
        setPouringToLayout(toLayout);

        // Prep animation values
        // Move FROM original position TO destination (offset slightly up/left)
        const targetX = toLayout.x - fromLayout.x - 20; // Shift left a bit
        const targetY = toLayout.y - fromLayout.y - 60; // Lift up

        pourAnimX.setValue(0);
        pourAnimY.setValue(0);
        pourRotation.setValue(0);
        streamOpacity.setValue(0);

        Animated.sequence([
            // 1. Move to position
            Animated.parallel([
                Animated.timing(pourAnimX, { toValue: targetX, duration: 400, useNativeDriver: true }),
                Animated.timing(pourAnimY, { toValue: targetY, duration: 400, useNativeDriver: true }),
            ]),
            // 2. Rotate to pour
            Animated.timing(pourRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
            // 3. Show Stream (fade in)
            Animated.timing(streamOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            // 4. Hold (Pouring time)
            Animated.delay(400),
        ]).start(() => {
            // 5. Commit State Change
            finishPour(fromIndex, toIndex);

            // 6. Cleanup Animation
            Animated.sequence([
                Animated.timing(streamOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(pourRotation, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.parallel([
                    Animated.timing(pourAnimX, { toValue: 0, duration: 400, useNativeDriver: true }),
                    Animated.timing(pourAnimY, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]),
            ]).start(() => {
                setIsPouring(false);
                setPouringFromIndex(null);
            });
        });
    };

    const finishPour = (fromIndex, toIndex) => {
        setMoveHistory([...moveHistory, tubes]);

        // Fluid animation for level change
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const newTubes = performPour(tubes, fromIndex, toIndex);
        setTubes(newTubes);
        setMoves(moves + 1);
        setSelectedTube(null);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            if (checkWin(newTubes)) {
                handleWin();
            }
        }, 500); // Check faster to not delay victory
    };

    const handleLayout = (index, layout) => {
        // Store layout relative to scroll view content
        // Since all tubes are in same container, relative positions work for delta calculation
        tubeLayouts.current[index] = layout;
    };

    const getStarRating = () => { /* Same as before */
        let thresholds;
        switch (difficulty) {
            case 'easy': thresholds = { steps: [15, 20] }; break;
            case 'medium': thresholds = { steps: [30, 40] }; break;
            case 'hard': thresholds = { steps: [60, 80] }; break;
            default: thresholds = { steps: [20, 30] };
        }
        if (moves <= thresholds.steps[0]) return 3;
        if (moves <= thresholds.steps[1]) return 2;
        return 1;
    };

    const handleWin = () => { /* Same as before */
        const stars = getStarRating();
        const starStr = '⭐'.repeat(stars);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
            '🎉 Puzzle Solved!',
            `Rating: ${starStr}\n\nYou completed the ${difficulty} puzzle in ${moves} moves.`,
            [
                { text: 'Play Again', onPress: () => handleStartGame(difficulty) },
                { text: 'Main Menu', onPress: () => handleBackToMenu() },
            ]
        );
        updateSolvedCount();
    };

    const updateSolvedCount = async () => {
        try {
            const current = await AsyncStorage.getItem('watersort_solved_count');
            const newCount = (parseInt(current) || 0) + 1;
            await AsyncStorage.setItem('watersort_solved_count', newCount.toString());
        } catch (e) {
            console.error(e);
        }
    };

    /* ... Undo, Reset, BackToMenu same ... */
    const handleUndo = () => {
        if (moveHistory.length > 0) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const previousState = moveHistory[moveHistory.length - 1];
            setTubes(previousState);
            setMoveHistory(moveHistory.slice(0, -1));
            setMoves(moves - 1);
            setSelectedTube(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleReset = () => {
        Alert.alert('Reset Puzzle', 'Restart?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset', onPress: () => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    const newPuzzle = generatePuzzle(difficulty);
                    setTubes(newPuzzle);
                    setSelectedTube(null);
                    setMoves(0);
                    setMoveHistory([]);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
            }
        ]);
    };

    const handleBackToMenu = () => {
        setGameStarted(false);
        setDifficulty(null);
        setSelectedTube(null);
        setIsPouring(false);
    };

    // Render Pouring Tube Overlay
    const renderPouringTube = () => {
        if (!isPouring || pouringFromIndex === null) return null;

        const tube = tubes[pouringFromIndex];
        const layout = tubeLayouts.current[pouringFromIndex];

        if (!tube || !layout || tube.length === 0) return null; // Safety check

        // Find top color for stream
        const topColor = tube[tube.length - 1];
        if (!topColor) return null; // Safety check
        const streamColors = Array.isArray(topColor) ? topColor : [topColor, topColor];

        // Animated Style
        const rotation = pourRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '60deg'],
        });

        return (
            <View pointerEvents="none" style={[styles.pouringOverlay, {
                left: layout.x,
                top: layout.y,
                width: layout.width,
                height: layout.height
            }]}>
                <Animated.View style={{
                    transform: [
                        { translateX: pourAnimX },
                        { translateY: pourAnimY },
                        { rotate: rotation }
                    ]
                }}>
                    <Tube
                        tube={tube}
                        index={pouringFromIndex}
                        isSelected={true}
                        onPress={() => { }}
                    // Visual trick: render same tube but maybe remove top layer? 
                    // For now just render full tube, level change happens after animation
                    />

                    {/* Water Stream */}
                    <Animated.View style={[styles.stream, { opacity: streamOpacity }]}>
                        <LinearGradient
                            colors={streamColors}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                </Animated.View>
            </View>
        );
    };

    if (!gameStarted) { /* Welcome Screen Same */
        return (
            <LinearGradient colors={['#000B18', '#002C55']} style={styles.container}>
                <StatusBar hidden={true} />
                <View style={styles.welcomeContent}>
                    <TouchableOpacity style={styles.absoluteBack} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.welcomeTitle}>💧 Water Sort</Text>
                    <Text style={styles.welcomeSubtitle}>Select Difficulty</Text>

                    <View style={styles.difficultySelection}>
                        <TouchableOpacity onPress={() => handleStartGame('easy')}>
                            <LinearGradient colors={['#56ab2f', '#a8e063']} style={styles.difficultyCard}>
                                <Text style={styles.difficultyCardIcon}>🌊</Text>
                                <View>
                                    <Text style={styles.difficultyCardTitle}>Easy</Text>
                                    <Text style={styles.difficultyCardDesc}>5 Tubes • 3 Colors</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleStartGame('medium')}>
                            <LinearGradient colors={['#3a7bd5', '#3a6073']} style={styles.difficultyCard}>
                                <Text style={styles.difficultyCardIcon}>💧</Text>
                                <View>
                                    <Text style={styles.difficultyCardTitle}>Medium</Text>
                                    <Text style={styles.difficultyCardDesc}>7 Tubes • 5 Colors</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleStartGame('hard')}>
                            <LinearGradient colors={['#ec008c', '#fc6767']} style={styles.difficultyCard}>
                                <Text style={styles.difficultyCardIcon}>🌀</Text>
                                <View>
                                    <Text style={styles.difficultyCardTitle}>Hard</Text>
                                    <Text style={styles.difficultyCardDesc}>12 Tubes • 10 Colors</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.rulesContainer}>
                        <Text style={styles.rulesTitle}>How to Play:</Text>
                        <Text style={styles.ruleText}>• Pour water to match colors</Text>
                        <Text style={styles.ruleText}>• Sort all colors to win!</Text>
                    </View>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
            <StatusBar hidden={true} />

            {/* Minimal Header */}
            <View style={styles.gameHeader}>
                <TouchableOpacity style={styles.menuBtn} onPress={handleBackToMenu}>
                    <Text style={styles.menuText}>☰ MENU</Text>
                </TouchableOpacity>
                <Text style={styles.gameTitle}>
                    {difficulty === 'easy' ? 'EASY' : difficulty === 'medium' ? 'MEDIUM' : 'HARD'}
                </Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                scrollEnabled={!isPouring} // Lock scroll during animation
            >
                {/* Move Counter */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>MOVES: {moves}</Text>
                </View>

                {/* Tubes Grid */}
                <View style={styles.tubesContainer}>
                    {tubes.map((tube, index) => (
                        <Tube
                            key={index}
                            tube={tube}
                            index={index}
                            isSelected={selectedTube === index && !isPouring}
                            onPress={handleTubePress}
                            onLayout={handleLayout}
                            isHidden={isPouring && pouringFromIndex === index}
                        />
                    ))}
                    {/* Overlay for animation */}
                    {renderPouringTube()}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={handleUndo} disabled={moveHistory.length === 0 || isPouring}>
                        <Text style={styles.actionBtnText}>↶ UNDO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={handleReset} disabled={isPouring}>
                        <Text style={styles.actionBtnText}>🔄 RESET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.newBtn]} onPress={() => handleStartGame(difficulty)} disabled={isPouring}>
                        <Text style={styles.actionBtnText}>✨ NEW GAME</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    /* ... Keep existing styles ... */
    // Add new styles for animation
    pouringOverlay: {
        position: 'absolute',
        zIndex: 100, // Always on top
    },
    stream: {
        position: 'absolute',
        top: 20, // Start from top of tube
        right: -10, // Pour out to the right
        width: STREAM_WIDTH,
        height: 200, // Long enough to reach target
        borderRadius: STREAM_WIDTH / 2,
        overflow: 'hidden',
        zIndex: 99,
    },
    /* ... Copy strict styles from previous version ... */
    container: { flex: 1 },
    welcomeContent: { flex: 1, padding: 20, justifyContent: 'center' },
    absoluteBack: { position: 'absolute', top: 20, left: 20, padding: 10, zIndex: 10 },
    backText: { fontSize: 30, color: '#fff', fontWeight: 'bold' },
    welcomeTitle: { fontSize: 40, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10, marginTop: 40, letterSpacing: 2 },
    welcomeSubtitle: { fontSize: 18, color: '#ccc', textAlign: 'center', marginBottom: 30, letterSpacing: 1 },
    difficultySelection: { gap: 15, marginBottom: 30 },

    difficultyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    difficultyCardIcon: { fontSize: 32, marginRight: 20 },
    difficultyCardTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    difficultyCardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

    rulesContainer: { padding: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
    rulesTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    ruleText: { fontSize: 14, color: '#ccc', marginBottom: 5 },

    scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 40, paddingTop: 10 },

    gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    menuBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },
    menuText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    gameTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },

    statsContainer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsText: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },

    tubesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 30, paddingHorizontal: 4, position: 'relative' },

    actionButtons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 },
    actionBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },
    undoBtn: { backgroundColor: '#8E2DE2' }, // Purple
    resetBtn: { backgroundColor: '#4A00E0' }, // Dark Purple
    newBtn: { backgroundColor: '#00c6ff' }, // Cyan
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
});

export default WaterSortScreen;
