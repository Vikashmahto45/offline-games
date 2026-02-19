import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { Constants } from './flappyBird/Constants';
import BirdRenderer from './flappyBird/Bird';
import Physics from './flappyBird/Physics';

const { width, height } = Dimensions.get('window');

const FlappyBirdScreen = ({ navigation }) => {
    const [running, setRunning] = useState(false);
    const [gameEngine, setGameEngine] = useState(null);
    const engineRef = useRef(null); // Ref to hold engine instance
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        loadBestScore();
        return () => {
            // Cleanup checks
            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world);
                Matter.Engine.clear(engineRef.current);
            }
        };
    }, []);

    const loadBestScore = async () => {
        try {
            const stored = await AsyncStorage.getItem('flappy_best_score');
            if (stored) setBestScore(parseInt(stored));
        } catch (e) {
            console.error(e);
        }
    };

    const saveScore = async (newScore) => {
        if (newScore > bestScore) {
            setBestScore(newScore);
            try {
                await AsyncStorage.setItem('flappy_best_score', newScore.toString());
            } catch (e) { }
        }
    };

    const setupWorld = () => {
        let engine = Matter.Engine.create({ enableSleeping: false });
        let world = engine.world;
        engine.gravity.y = Constants.PHYSICS.gravity;
        engineRef.current = engine;

        // Bird
        let bird = Matter.Bodies.rectangle(width / 4, height / 2, Constants.BIRD_WIDTH, Constants.BIRD_HEIGHT, {
            resolution: 1,
            frictionAir: 0.05,
            label: 'Bird'
        });
        Matter.World.add(world, bird);

        // Ceiling/Floor (Static boundaries to trigger collision)
        // Floor
        let floor = Matter.Bodies.rectangle(width / 2, height, width, 50, { isStatic: true, label: 'Floor' });
        Matter.World.add(world, floor);

        // Ceiling
        let ceiling = Matter.Bodies.rectangle(width / 2, -25, width, 50, { isStatic: true, label: 'Ceiling' });
        Matter.World.add(world, ceiling);

        Matter.Events.on(engine, 'collisionStart', (event) => {
            // dispatch event via gameEngine ref if possible, but we are inside setup.
            // Better to handle collision in Physics system or check body state.
            // But we can dispatch globally to the engine if we have the ref? No.
            // We'll rely on Physics system checking bounds or body.label
            // ACTUALLY, Physics.js can check collisions if we iterate pairs, or we can use a flag on entity.

            // Let's set a flag on the bird entity if collision happens
            // But entities are not accessible here easily.
            // We will let Physics.js handle 'Game Over' conditions by checking Y bounds.
            // For pipe collisions, we can iterate pairs in Physics.js.
            let pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                let pair = pairs[i];
                if ((pair.bodyA.label === 'Bird' && pair.bodyB.label.includes('Pipe')) ||
                    (pair.bodyB.label === 'Bird' && pair.bodyA.label.includes('Pipe'))) {
                    // Collision with pipe
                    // We need to signal game over. 
                    // We can emit an event on the engine object itself?
                    engine.dispatchGameOver = true;
                }
            }
        });

        return {
            physics: { engine: engine, world: world },
            Bird: { body: bird, size: [Constants.BIRD_WIDTH, Constants.BIRD_HEIGHT], renderer: BirdRenderer },
        };
    };

    const onEvent = (e) => {
        if (e.type === 'game_over') {
            if (!gameOver) {
                setRunning(false);
                setGameOver(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                saveScore(score);
                if (gameEngine) gameEngine.stop();
            }
        } else if (e.type === 'score') {
            setScore(s => s + 1);
        } else if (e.type === 'flap') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const togglePause = () => {
        setPaused(!paused);
    };

    const startGame = () => {
        setScore(0);
        setGameOver(false);
        setRunning(true);
        if (gameEngine) gameEngine.swap(setupWorld());
    };

    // We need to inject collision handling into Physics or check engine flag
    // I'll update Physics.js to check engine.dispatchGameOver

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <LinearGradient colors={['#38bdf8', '#0ea5e9']} style={styles.bg} />

            <GameEngine
                ref={(ref) => setGameEngine(ref)}
                style={styles.gameContainer}
                systems={[Physics]}
                entities={setupWorld()}
                running={running && !paused}
                onEvent={onEvent}
            >
                <StatusBar hidden={true} />
            </GameEngine>

            {/* HUD */}
            <View style={styles.hud}>
                <Text style={styles.scoreText}>{score}</Text>
            </View>

            {/* Pause Button */}
            {running && !gameOver && !paused && (
                <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
                    <Text style={styles.pauseText}>⏸️</Text>
                </TouchableOpacity>
            )}

            {/* Menus */}
            {!running && !gameOver && (
                <View style={styles.menu}>
                    <Text style={styles.title}>Flappy Bird 🐦</Text>
                    <TouchableOpacity onPress={startGame} style={styles.btn}>
                        <Text style={styles.btnText}>PLAY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { marginTop: 15, backgroundColor: '#4B5563' }]}>
                        <Text style={styles.btnText}>EXIT</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pause Menu */}
            {paused && (
                <View style={styles.menu}>
                    <Text style={styles.title}>PAUSED</Text>
                    <TouchableOpacity onPress={togglePause} style={styles.btn}>
                        <Text style={styles.btnText}>RESUME</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { marginTop: 15, backgroundColor: '#4B5563' }]}>
                        <Text style={styles.btnText}>EXIT</Text>
                    </TouchableOpacity>
                </View>
            )}

            {gameOver && (
                <View style={styles.menu}>
                    <Text style={styles.title}>Game Over</Text>
                    <Text style={styles.subTitle}>Score: {score}</Text>
                    <Text style={styles.subTitle}>Best: {bestScore}</Text>
                    <TouchableOpacity onPress={startGame} style={styles.btn}>
                        <Text style={styles.btnText}>RETRY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { marginTop: 15, backgroundColor: '#4B5563' }]}>
                        <Text style={styles.btnText}>EXIT</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    bg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
    gameContainer: { flex: 1 },
    hud: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 10 },
    scoreText: { fontSize: 60, fontWeight: 'bold', color: 'white', textShadowRadius: 5, textShadowColor: 'black', elevation: 5 },
    pauseBtn: { position: 'absolute', top: 40, right: 20, zIndex: 50, padding: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10 },
    pauseText: { fontSize: 24 },
    menu: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 20
    },
    title: { fontSize: 40, color: 'white', fontWeight: 'bold', marginBottom: 20 },
    subTitle: { fontSize: 24, color: 'white', marginBottom: 10 },
    btn: { backgroundColor: '#F59E0B', paddingHorizontal: 50, paddingVertical: 15, borderRadius: 25, borderWidth: 3, borderColor: '#fff', elevation: 5 },
    btnText: { fontSize: 24, fontWeight: 'bold', color: 'white', letterSpacing: 1 }
});

export default FlappyBirdScreen;
