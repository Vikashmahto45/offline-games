import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';
import Bolt from './nutsBolts/Bolt';
import { generateLevel, isValidMove, checkWin } from './nutsBolts/gameLogic';
import { LinearGradient } from 'expo-linear-gradient';

const NutsBoltsScreen = ({ navigation }) => {
    const [level, setLevel] = useState(1);
    const [bolts, setBolts] = useState([]);
    const [selectedBolt, setSelectedBolt] = useState(null);
    const [history, setHistory] = useState([]);
    const [gameWon, setGameWon] = useState(false);

    const [screen, setScreen] = useState('MENU'); // 'MENU' | 'GAME'

    // Initialize
    useEffect(() => {
        // startNewGame(); // Don't auto-start, show menu first
    }, []);

    const startNewGame = (lvl = level) => {
        let diff = 'medium';
        if (lvl <= 5) diff = 'easy';
        else if (lvl <= 15) diff = 'medium';
        else diff = 'hard';

        const { bolts: newBolts } = generateLevel(diff);
        setBolts(newBolts);
        setLevel(lvl);
        setScreen('GAME');
        setSelectedBolt(null);
        setHistory([]);
        setGameWon(false);
    };

    const handleBackToMenu = () => {
        setScreen('MENU');
        setGameWon(false);
    };

    const handlePress = (index) => {
        if (gameWon) return;

        if (selectedBolt === null) {
            // Pick up
            const bolt = bolts[index];
            if (bolt.length > 0) {
                setSelectedBolt(index);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } else {
            // Drop attempt
            if (selectedBolt === index) {
                // Deselect
                setSelectedBolt(null);
            } else {
                // Move logic
                if (isValidMove(bolts, selectedBolt, index)) {
                    performMove(selectedBolt, index);
                } else {
                    // Invalid
                    setSelectedBolt(null);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            }
        }
    };

    const performMove = (from, to) => {
        // Save history
        setHistory([...history, bolts.map(b => [...b])]);

        // Exec move
        const newBolts = bolts.map(b => [...b]);
        const nut = newBolts[from].pop();
        newBolts[to].push(nut);

        setBolts(newBolts);
        setSelectedBolt(null);
        Haptics.selectionAsync();

        // Check Win
        if (checkWin(newBolts)) {
            setGameWon(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Level Complete! 🔧", "You sorted all the nuts!", [
                { text: "Next Level", onPress: () => startNewGame(level + 1) }
            ]);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setBolts(prev);
        setHistory(history.slice(0, -1));
        setSelectedBolt(null);
    };

    if (screen === 'MENU') {
        const levels = Array.from({ length: 20 }, (_, i) => i + 1);
        return (
            <LinearGradient colors={['#111827', '#374151']} style={styles.container}>
                <StatusBar hidden={true} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.absoluteBack}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.menuContent}>
                    <Text style={styles.menuTitle}>NUTS & BOLTS</Text>
                    <Text style={styles.menuSubtitle}>Select Level</Text>

                    <View style={styles.levelGrid}>
                        {levels.map(lvl => {
                            let bg = '#10B981'; // Easy
                            if (lvl > 5) bg = '#3B82F6'; // Med
                            if (lvl > 15) bg = '#EF4444'; // Hard

                            return (
                                <TouchableOpacity
                                    key={lvl}
                                    style={[styles.levelBtn, { backgroundColor: bg }]}
                                    onPress={() => startNewGame(lvl)}
                                >
                                    <Text style={styles.levelBtnText}>{lvl}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1F2937', '#111827']}
                style={styles.background}
            />

            {/* Header Area */}
            <View style={styles.gameHeader}>
                <TouchableOpacity onPress={handleBackToMenu} style={styles.menuBtn}>
                    <Text style={styles.menuText}>☰ MENU</Text>
                </TouchableOpacity>
                <Text style={styles.headerLevel}>LEVEL {level}</Text>
                <View style={{ width: 50 }} />
            </View>

            <StatusBar hidden={true} />

            {/* Game Area */}
            <ScrollView contentContainerStyle={styles.gameContainer}>
                <View style={styles.boltsGrid}>
                    {bolts.map((boltNuts, i) => (
                        <Bolt
                            key={i}
                            index={i}
                            nuts={boltNuts}
                            isSelected={selectedBolt === i}
                            onPress={handlePress}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtn} onPress={handleUndo}>
                    <Text style={styles.controlText}>↺ Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn]} onPress={() => startNewGame(level)}>
                    <Text style={styles.controlText}>↻ Restart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    background: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
    },
    absoluteBack: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    backText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

    // Menu Styles
    menuContent: { padding: 20, alignItems: 'center', paddingTop: 60 },
    menuTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10, letterSpacing: 2 },
    menuSubtitle: { fontSize: 18, color: '#aaa', marginBottom: 30 },
    levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    levelBtn: { width: 70, height: 70, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    levelBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

    // Game Header
    gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20 },
    menuBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
    menuText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    headerLevel: { color: 'rgba(255,255,255,0.7)', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },

    gameContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    boltsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20, // Space inside grid handled by margins in Bolt
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 40,
        gap: 20,
    },
    controlBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#374151',
        borderRadius: 8,
    },
    primaryBtn: {
        backgroundColor: theme.colors.primary,
    },
    controlText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default NutsBoltsScreen;
