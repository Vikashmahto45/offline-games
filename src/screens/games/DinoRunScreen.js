import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── ALL CONSTANTS INLINE (no import issues) ───
const GROUND_TOP = SCREEN_H - 200; // Y position of the ground line from top
const DINO_W = 45;
const DINO_H = 50;
const DINO_LEFT = 50;
const JUMP_VEL = -18;
const GRAVITY = 0.65;
const CACTUS_W = 22;
const CACTUS_H = 35;

export default function DinoRunScreen({ navigation }) {
    const [, forceUpdate] = useState(0); // Trigger re-render

    // All mutable game state in refs (avoids stale closures)
    const playing = useRef(false);
    const paused = useRef(false);
    const dead = useRef(false);
    const score = useRef(0);
    const highScore = useRef(0);
    const level = useRef(1);
    const speed = useRef(2.5);

    // Dino refs
    const dinoBottom = useRef(0); // Distance from ground (0 = on ground)
    const velY = useRef(0);
    const jumping = useRef(false);

    // Obstacles ref: array of { x, h, w, type }
    const obstacles = useRef([]);
    const spawnTimer = useRef(0);

    const loopId = useRef(null);

    // ─── GAME LOOP ───
    const tick = () => {
        if (dead.current) return;

        // 1) Jump physics
        if (jumping.current) {
            velY.current += GRAVITY;
            dinoBottom.current -= velY.current;
            if (dinoBottom.current <= 0) {
                dinoBottom.current = 0;
                velY.current = 0;
                jumping.current = false;
            }
        }

        // 2) Move obstacles
        for (let i = obstacles.current.length - 1; i >= 0; i--) {
            obstacles.current[i].x -= speed.current;
            if (obstacles.current[i].x < -60) {
                obstacles.current.splice(i, 1);
            }
        }

        // 3) Spawn new obstacle
        spawnTimer.current -= 16; // ~60fps
        if (spawnTimer.current <= 0) {
            // Only spawn if no obstacle is too close to the right edge
            const lastObs = obstacles.current[obstacles.current.length - 1];
            const safeToSpawn = !lastObs || lastObs.x < SCREEN_W - 200;

            if (safeToSpawn) {
                const isDouble = Math.random() > 0.7;
                const w = isDouble ? CACTUS_W * 2 : CACTUS_W;
                const h = CACTUS_H + Math.floor(Math.random() * 5); // Max 40px
                obstacles.current.push({
                    x: SCREEN_W + 20,
                    w: w,
                    h: h,
                    type: 'cactus',
                });
            }
            // Bigger gaps so player has time to react
            const minGap = Math.max(1200, 2000 - speed.current * 60);
            spawnTimer.current = minGap + Math.random() * 600;
        }

        // 4) Collision detection (simple AABB)
        const dLeft = DINO_LEFT + 5;
        const dRight = DINO_LEFT + DINO_W - 5;
        const dTop = GROUND_TOP - DINO_H - dinoBottom.current;
        const dBottom = GROUND_TOP - dinoBottom.current;

        for (const obs of obstacles.current) {
            const oLeft = obs.x + 3;
            const oRight = obs.x + obs.w - 3;
            const oTop = GROUND_TOP - obs.h;
            const oBottom = GROUND_TOP;

            if (dRight > oLeft && dLeft < oRight && dBottom > oTop && dTop < oBottom) {
                // HIT!
                die();
                return;
            }
        }

        // 5) Score
        score.current += 1;

        // 6) Speed up every 400 ticks (slower ramp)
        if (score.current % 400 === 0 && speed.current < 12) {
            speed.current += 0.3;
            level.current += 1;
        }

        // 7) Re-render
        forceUpdate(n => n + 1);

        loopId.current = requestAnimationFrame(tick);
    };

    // ─── ACTIONS ───
    const startGame = () => {
        dead.current = false;
        playing.current = true;
        score.current = 0;
        level.current = 1;
        speed.current = 2.5;
        dinoBottom.current = 0;
        velY.current = 0;
        jumping.current = false;
        obstacles.current = [];
        spawnTimer.current = 1000;

        cancelAnimationFrame(loopId.current);
        loopId.current = requestAnimationFrame(tick);
        forceUpdate(n => n + 1);
    };

    const die = () => {
        dead.current = true;
        playing.current = false;
        cancelAnimationFrame(loopId.current);
        if (Math.floor(score.current / 6) > highScore.current) {
            highScore.current = Math.floor(score.current / 6);
            saveHighScore(highScore.current);
        }
        forceUpdate(n => n + 1);
    };

    const saveHighScore = async (value) => {
        try {
            await AsyncStorage.setItem('dino_hiscore', value.toString());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadHighScore();
        return () => cancelAnimationFrame(loopId.current);
    }, []);

    const loadHighScore = async () => {
        try {
            const stored = await AsyncStorage.getItem('dino_hiscore');
            if (stored) {
                highScore.current = parseInt(stored);
                forceUpdate(n => n + 1);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const togglePause = () => {
        if (!playing.current || dead.current) return;

        if (paused.current) {
            // RESUME
            paused.current = false;
            loopId.current = requestAnimationFrame(tick);
        } else {
            // PAUSE
            paused.current = true;
            cancelAnimationFrame(loopId.current);
        }
        forceUpdate(n => n + 1);
    };

    const jump = () => {
        if (paused.current) return;
        if (!playing.current) {
            startGame();
            return;
        }
        if (dead.current) return;
        if (!jumping.current) {
            jumping.current = true;
            velY.current = JUMP_VEL;
        }
    };

    // Cleanup
    // useEffect(() => {
    //     return () => cancelAnimationFrame(loopId.current);
    // }, []);

    // ─── DERIVED VALUES ───
    const displayScore = Math.floor(score.current / 6);
    const dinoTop = GROUND_TOP - DINO_H - dinoBottom.current;

    return (
        <View style={styles.container}>
            {/* TAP AREA (covers entire screen) */}
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={jump}
                activeOpacity={1}
            >
                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <View style={styles.levelBox}>
                        <Text style={styles.levelText}>LV {level.current}</Text>
                    </View>
                    <View style={styles.scoreArea}>
                        <Text style={styles.hiScore}>HI {String(highScore.current).padStart(5, '0')}</Text>
                        <Text style={styles.score}>{String(displayScore).padStart(5, '0')}</Text>
                        <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
                            <Text style={styles.pauseText}>{paused.current ? "▶️" : "⏸️"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── DINO ── */}
                <View style={[styles.dino, { top: dinoTop, left: DINO_LEFT }]}>
                    {/* Head */}
                    <View style={styles.dinoHead}>
                        <View style={styles.dinoEye} />
                        <View style={styles.dinoMouth} />
                    </View>
                    {/* Body */}
                    <View style={styles.dinoBody} />
                    {/* Arms */}
                    <View style={styles.dinoArm} />
                    {/* Legs */}
                    <View style={[styles.dinoLeg, { left: 8 }]} />
                    <View style={[styles.dinoLeg, { left: 24, height: jumping.current ? 6 : 10 }]} />
                    {/* Tail */}
                    <View style={styles.dinoTail} />
                </View>

                {/* ── OBSTACLES ── */}
                {obstacles.current.map((obs, i) => (
                    <View
                        key={i}
                        style={[
                            styles.cactusBase,
                            {
                                left: obs.x,
                                top: GROUND_TOP - obs.h,
                                width: obs.w,
                                height: obs.h,
                            },
                        ]}
                    >
                        {/* Cactus details */}
                        <View style={styles.cactusSpine} />
                        <View style={styles.cactusArmL} />
                        <View style={styles.cactusArmR} />
                    </View>
                ))}

                {/* ── GROUND ── */}
                <View style={[styles.groundLine, { top: GROUND_TOP }]} />
                <View style={[styles.groundArea, { top: GROUND_TOP + 2 }]}>
                    {/* Ground texture dots */}
                    {[20, 80, 140, 200, 270, 330, 50, 170, 240, 310].map((lx, i) => (
                        <View key={i} style={[styles.groundDot, { left: lx % SCREEN_W, top: 5 + (i % 3) * 8 }]} />
                    ))}
                </View>

                {/* ── START SCREEN ── */}
                {!playing.current && !dead.current && (
                    <View style={styles.startScreen}>
                        <Text style={styles.startEmoji}>🦖</Text>
                        <Text style={styles.startTitle}>DINO RUN</Text>
                        <Text style={styles.startSub}>Tap anywhere to start</Text>
                        <Text style={styles.startHint}>Tap to jump over cactus!</Text>
                    </View>
                )}

                {/* ── PAUSE SCREEN ── */}
                {paused.current && (
                    <View style={styles.gameOverBg}>
                        <View style={styles.gameOverCard}>
                            <Text style={styles.goTitle}>PAUSED</Text>
                            <View style={styles.goButtons}>
                                <TouchableOpacity
                                    style={[styles.goBtn, { backgroundColor: '#e53935' }]}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.goBtnText}>EXIT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.goBtn, { backgroundColor: '#43a047' }]}
                                    onPress={togglePause}
                                >
                                    <Text style={styles.goBtnText}>RESUME</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── GAME OVER ── */}
                {dead.current && (
                    <View style={styles.gameOverBg}>
                        <View style={styles.gameOverCard}>
                            <Text style={styles.goTitle}>GAME OVER</Text>
                            <Text style={styles.goScore}>Score: {displayScore}</Text>
                            <Text style={styles.goHigh}>Best: {highScore.current}</Text>
                            <Text style={styles.goLevel}>Level Reached: {level.current}</Text>
                            <View style={styles.goButtons}>
                                <TouchableOpacity
                                    style={[styles.goBtn, { backgroundColor: '#e53935' }]}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.goBtnText}>EXIT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.goBtn, { backgroundColor: '#43a047' }]}
                                    onPress={startGame}
                                >
                                    <Text style={styles.goBtnText}>RETRY</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },

    // ── Header ──
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 200,
    },
    levelBox: {
        backgroundColor: '#ff9800',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    levelText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scoreArea: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
    },
    hiScore: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#999',
        fontWeight: 'bold',
    },
    score: {
        fontFamily: 'monospace',
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold',
    },
    pauseBtn: {
        marginLeft: 10,
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 5,
    },
    pauseText: {
        fontSize: 20,
    },

    // ── Dino ──
    dino: {
        position: 'absolute',
        width: DINO_W,
        height: DINO_H,
        zIndex: 50,
    },
    dinoBody: {
        position: 'absolute',
        bottom: 10,
        left: 5,
        width: 30,
        height: 28,
        backgroundColor: '#555',
        borderRadius: 4,
    },
    dinoHead: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 26,
        height: 20,
        backgroundColor: '#555',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 2,
        zIndex: 2,
    },
    dinoEye: {
        position: 'absolute',
        top: 5,
        right: 4,
        width: 4,
        height: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    dinoMouth: {
        position: 'absolute',
        bottom: 2,
        right: 0,
        width: 14,
        height: 2,
        backgroundColor: '#333',
    },
    dinoArm: {
        position: 'absolute',
        bottom: 22,
        right: 2,
        width: 8,
        height: 4,
        backgroundColor: '#555',
    },
    dinoLeg: {
        position: 'absolute',
        bottom: 0,
        width: 7,
        height: 10,
        backgroundColor: '#555',
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    },
    dinoTail: {
        position: 'absolute',
        bottom: 20,
        left: -6,
        width: 10,
        height: 6,
        backgroundColor: '#555',
        borderTopLeftRadius: 4,
    },

    // ── Cactus ──
    cactusBase: {
        position: 'absolute',
        backgroundColor: '#2e7d32',
        borderRadius: 3,
        zIndex: 40,
    },
    cactusSpine: {
        position: 'absolute',
        top: 0,
        left: '50%',
        marginLeft: -1,
        width: 2,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    cactusArmL: {
        position: 'absolute',
        top: 8,
        left: -5,
        width: 5,
        height: 14,
        backgroundColor: '#2e7d32',
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 2,
    },
    cactusArmR: {
        position: 'absolute',
        top: 4,
        right: -4,
        width: 4,
        height: 10,
        backgroundColor: '#2e7d32',
        borderTopRightRadius: 4,
    },

    // ── Ground ──
    groundLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#555',
        zIndex: 30,
    },
    groundArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 30,
        zIndex: 1,
    },
    groundDot: {
        position: 'absolute',
        width: 3,
        height: 1,
        backgroundColor: '#bbb',
    },

    // ── Start ──
    startScreen: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 300,
        backgroundColor: 'rgba(245,245,245,0.95)',
    },
    startEmoji: {
        fontSize: 60,
        marginBottom: 10,
    },
    startTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    startSub: {
        fontSize: 16,
        color: '#888',
        marginBottom: 5,
    },
    startHint: {
        fontSize: 13,
        color: '#aaa',
        fontStyle: 'italic',
    },

    // ── Game Over ──
    gameOverBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
    },
    gameOverCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        minWidth: 260,
    },
    goTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'monospace',
        marginBottom: 10,
    },
    goScore: {
        fontSize: 22,
        color: '#333',
        marginBottom: 4,
    },
    goHigh: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    goLevel: {
        fontSize: 14,
        color: '#ff9800',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    goButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    goBtn: {
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 25,
        elevation: 3,
    },
    goBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
