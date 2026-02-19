import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { Constants } from './whacamole/Constants';
import Mole from './whacamole/Mole';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WhacAMoleScreen({ navigation }) {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(Constants.GAME_DURATION);
    const [activeMole, setActiveMole] = useState(null); // Index of active mole 0-8
    const [isPlaying, setIsPlaying] = useState(false);

    const timerRef = useRef(null);
    const moleTimerRef = useRef(null);

    // Grid initialized with 9 empty items
    const grid = Array(9).fill(null);

    const startGame = () => {
        setScore(0);
        setTimeLeft(Constants.GAME_DURATION);
        setIsPlaying(true);
        setActiveMole(null);
    };

    const gameOver = () => {
        setIsPlaying(false);
        setActiveMole(null);
        clearInterval(timerRef.current);
        clearTimeout(moleTimerRef.current);
        Alert.alert(
            "Game Over!",
            `You whacked ${score / Constants.POINTS_PER_HIT} moles!\nFinal Score: ${score}`,
            [
                { text: "Menu", onPress: () => navigation.goBack() },
                { text: "Play Again", onPress: startGame }
            ]
        );
    };

    // Game Timer and Loop
    useEffect(() => {
        if (isPlaying) {
            // Counts down game time
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        gameOver();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Mole Spawning Loop
            const scheduleNextMole = () => {
                if (!isPlaying) return;

                // Pick random hole
                const nextHole = Math.floor(Math.random() * 9);
                setActiveMole(nextHole);

                // Hide mole after duration
                moleTimerRef.current = setTimeout(() => {
                    setActiveMole(null);
                    // Schedule next pop immediately or with slight delay
                    // Random delay between 200ms and 600ms
                    const delay = Math.random() * 400 + 200;
                    if (isPlaying) {
                        // Recursive timeout for variable intervals
                        setTimeout(scheduleNextMole, delay);
                    }
                }, Constants.MOLE_POP_DURATION);
            };

            scheduleNextMole();
        }

        return () => {
            clearInterval(timerRef.current);
            clearTimeout(moleTimerRef.current);
        };
    }, [isPlaying]);

    const handleWhack = (index) => {
        if (!isPlaying) return;

        if (index === activeMole) {
            // Hit!
            setScore(prev => prev + Constants.POINTS_PER_HIT);

            // Don't hide immediately! Let the "Bonk" animation play in the Mole component.
            // The existing timeout in the loop will eventually hide it, 
            // OR we can force a hide after a small delay if we want faster pacing.

            // Optional: Force next mole faster?
            // For now, let's just count the score.
        }
    };

    // ... (existing imports, keep them)

    // ... (existing imports, keep them)

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.scoreBox}>
                    <Text style={styles.label}>SCORE</Text>
                    <Text style={styles.value}>{score}</Text>
                </View>
                <View style={[styles.scoreBox, { backgroundColor: '#ff7043' }]}>
                    <Text style={styles.label}>TIME</Text>
                    <Text style={styles.value}>{timeLeft}s</Text>
                </View>
            </View>

            {/* Game Grid */}
            <View style={styles.gridContainer}>
                <View style={styles.gridBackground}>
                    <View style={styles.grid}>
                        {grid.map((_, index) => (
                            <Mole
                                key={index}
                                active={activeMole === index}
                                onWhack={() => handleWhack(index)}
                            />
                        ))}
                    </View>
                </View>
            </View>

            {/* Start Overlay */}
            {!isPlaying && timeLeft === Constants.GAME_DURATION && (
                <View style={styles.overlay}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Whac-A-Mole</Text>
                        <Text style={styles.subtitle}>Tap the moles fast!</Text>
                        <TouchableOpacity style={styles.startButton} onPress={startGame}>
                            <Text style={styles.startText}>PLAY</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#81c784',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginTop: 10,
    },
    scoreBox: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 15,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    label: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    value: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gridContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40, // Space for bottom safe area
    },
    gridBackground: {
        backgroundColor: '#558b2f',
        borderRadius: 30,
        padding: 15, // Inner padding around grid
        borderWidth: 6,
        borderColor: '#33691e',
        elevation: 10, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: Constants.GRID_SIZE * (Constants.HOLE_SIZE + 20), // Exact width based on item size
        justifyContent: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    card: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 10,
        width: '80%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#e65100',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    startButton: {
        backgroundColor: '#ffb74d',
        paddingHorizontal: 60,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
    },
    startText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
});
