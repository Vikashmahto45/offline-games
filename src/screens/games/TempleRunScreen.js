import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── CONSTANTS ───
const LANE_COUNT = 3;
const LANE_W = Math.floor(SW / 5); // Each lane width
const LANE_GAP = 8;
const TRACK_W = LANE_COUNT * LANE_W + (LANE_COUNT - 1) * LANE_GAP;
const TRACK_LEFT = (SW - TRACK_W) / 2;

const PLAYER_W = LANE_W - 10;
const PLAYER_H = 50;
const PLAYER_BOTTOM = 180;

const OBSTACLE_H = 40;
const COIN_SIZE = 22;
const SWIPE_THRESHOLD = 30;

// Lane X positions (center of each lane)
const laneX = (lane) => TRACK_LEFT + lane * (LANE_W + LANE_GAP) + LANE_W / 2;

export default function TempleRunScreen({ navigation }) {
    const [, forceUpdate] = useState(0);

    // Game state refs
    const playing = useRef(false);
    const paused = useRef(false);
    const dead = useRef(false);
    const score = useRef(0);
    const coins = useRef(0);
    const level = useRef(1);
    const speed = useRef(3);
    const distance = useRef(0);

    // Player
    const lane = useRef(1); // 0=left, 1=center, 2=right
    const jumping = useRef(false);
    const sliding = useRef(false);
    const jumpY = useRef(0); // Offset from base
    const jumpVel = useRef(0);

    // Obstacles & coins arrays: { lane, y, type: 'low'|'high'|'coin' }
    const items = useRef([]);
    const spawnTimer = useRef(0);
    const loopId = useRef(null);

    // Track stripes animation
    const stripeOffset = useRef(0);

    // ─── SWIPE HANDLER ───
    const gestureStart = useRef({ x: 0, y: 0 });
    const panRef = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_, g) => {
                gestureStart.current = { x: g.x0, y: g.y0 };
            },
            onPanResponderRelease: (_, g) => {
                if (!playing.current && !dead.current) {
                    startGame();
                    return;
                }
                if (dead.current) return;
                if (paused.current) return;

                const dx = g.moveX - gestureStart.current.x;
                const dy = g.moveY - gestureStart.current.y;

                // Only register if swipe distance is significant
                if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal swipe
                    if (dx > SWIPE_THRESHOLD && lane.current < 2) {
                        lane.current += 1;
                    } else if (dx < -SWIPE_THRESHOLD && lane.current > 0) {
                        lane.current -= 1;
                    }
                } else {
                    // Vertical swipe
                    if (dy < -SWIPE_THRESHOLD && !jumping.current) {
                        // Swipe UP → Jump
                        jumping.current = true;
                        jumpVel.current = -12;
                    } else if (dy > SWIPE_THRESHOLD && !jumping.current) {
                        // Swipe DOWN → Slide
                        sliding.current = true;
                        setTimeout(() => { sliding.current = false; forceUpdate(n => n + 1); }, 500);
                    }
                }
                forceUpdate(n => n + 1);
            },
        })
    ).current;

    // ─── GAME LOOP ───
    const tick = () => {
        if (dead.current || !playing.current) return;

        // Jump physics
        if (jumping.current) {
            jumpVel.current += 0.7; // Gravity
            jumpY.current += jumpVel.current;
            if (jumpY.current >= 0) {
                jumpY.current = 0;
                jumpVel.current = 0;
                jumping.current = false;
            }
        }

        // Move items down
        for (let i = items.current.length - 1; i >= 0; i--) {
            items.current[i].y += speed.current;
            if (items.current[i].y > SH + 50) {
                items.current.splice(i, 1);
            }
        }

        // Spawn new items
        spawnTimer.current -= 16;
        if (spawnTimer.current <= 0) {
            const rand = Math.random();
            const spawnLane = Math.floor(Math.random() * LANE_COUNT);

            if (rand < 0.35) {
                // Low obstacle (jump over)
                items.current.push({ lane: spawnLane, y: -60, type: 'low' });
            } else if (rand < 0.55) {
                // High obstacle (slide under)
                items.current.push({ lane: spawnLane, y: -60, type: 'high' });
            } else if (rand < 0.8) {
                // Coin
                items.current.push({ lane: spawnLane, y: -60, type: 'coin' });
            } else {
                // Two obstacles in different lanes
                const lane2 = (spawnLane + 1 + Math.floor(Math.random() * 2)) % LANE_COUNT;
                items.current.push({ lane: spawnLane, y: -60, type: 'low' });
                items.current.push({ lane: lane2, y: -60, type: 'low' });
            }

            const minGap = Math.max(500, 1200 - speed.current * 40);
            spawnTimer.current = minGap + Math.random() * 600;
        }

        // Collision detection
        const playerY = SH - PLAYER_BOTTOM + jumpY.current;
        const pLeft = laneX(lane.current) - PLAYER_W / 2;
        const pRight = pLeft + PLAYER_W;
        const pTop = playerY - PLAYER_H;
        const pBottom = playerY;

        for (let i = items.current.length - 1; i >= 0; i--) {
            const item = items.current[i];
            const iCenterX = laneX(item.lane);
            const iLeft = iCenterX - LANE_W / 2 + 5;
            const iRight = iCenterX + LANE_W / 2 - 5;

            if (item.type === 'coin') {
                const iTop = item.y;
                const iBottom = item.y + COIN_SIZE;
                if (pRight > iLeft && pLeft < iRight && pBottom > iTop && pTop < iBottom) {
                    coins.current += 1;
                    score.current += 50;
                    items.current.splice(i, 1);
                }
            } else if (item.type === 'low') {
                // Low obstacle: must jump over
                const iTop = item.y;
                const iBottom = item.y + OBSTACLE_H;
                if (pRight > iLeft && pLeft < iRight && pBottom > iTop && pTop < iBottom) {
                    if (!jumping.current || jumpY.current > -30) {
                        // Didn't jump high enough
                        die();
                        return;
                    }
                }
            } else if (item.type === 'high') {
                // High obstacle: must slide under
                const iTop = item.y;
                const iBottom = item.y + OBSTACLE_H;
                if (pRight > iLeft && pLeft < iRight && pBottom > iTop && pTop < iBottom) {
                    if (!sliding.current) {
                        die();
                        return;
                    }
                }
            }
        }

        // Update score & distance
        distance.current += speed.current;
        score.current += 1;

        // Level up every 500 distance
        if (distance.current % 500 < speed.current && speed.current < 10) {
            speed.current += 0.2;
            level.current = Math.floor(speed.current - 2);
        }

        // Track stripe animation
        stripeOffset.current = (stripeOffset.current + speed.current) % 40;

        forceUpdate(n => n + 1);
        loopId.current = requestAnimationFrame(tick);
    };

    // ─── ACTIONS ───
    const startGame = () => {
        dead.current = false;
        playing.current = true;
        score.current = 0;
        coins.current = 0;
        level.current = 1;
        speed.current = 3;
        distance.current = 0;
        lane.current = 1;
        jumping.current = false;
        sliding.current = false;
        jumpY.current = 0;
        jumpVel.current = 0;
        items.current = [];
        spawnTimer.current = 800;
        stripeOffset.current = 0;

        cancelAnimationFrame(loopId.current);
        loopId.current = requestAnimationFrame(tick);
        forceUpdate(n => n + 1);
    };

    const die = () => {
        dead.current = true;
        playing.current = false;
        cancelAnimationFrame(loopId.current);
        checkHighScore();
        forceUpdate(n => n + 1);
    };

    const checkHighScore = async () => {
        try {
            const current = await AsyncStorage.getItem('temple_run_hiscore');
            const currentHigh = parseInt(current) || 0;
            if (score.current > currentHigh) {
                await AsyncStorage.setItem('temple_run_hiscore', score.current.toString());
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => () => cancelAnimationFrame(loopId.current), []);

    const togglePause = () => {
        if (!playing.current || dead.current) return;

        if (paused.current) {
            paused.current = false;
            loopId.current = requestAnimationFrame(tick);
        } else {
            paused.current = true;
            cancelAnimationFrame(loopId.current);
        }
        forceUpdate(n => n + 1);
    };

    // ─── RENDER HELPERS ───
    const playerX = laneX(lane.current) - PLAYER_W / 2;
    const playerY = SH - PLAYER_BOTTOM + jumpY.current;
    const displayScore = Math.floor(score.current / 3);

    // Generate track stripes
    const stripes = [];
    for (let y = -40 + stripeOffset.current; y < SH; y += 40) {
        stripes.push(y);
    }

    return (
        <View style={styles.container} {...panRef.panHandlers}>

            {/* ── TRACK BACKGROUND ── */}
            <View style={[styles.track, { left: TRACK_LEFT, width: TRACK_W }]}>
                {/* Lane dividers */}
                {[1, 2].map(i => (
                    <View
                        key={i}
                        style={[
                            styles.laneDivider,
                            { left: i * (LANE_W + LANE_GAP) - LANE_GAP / 2 - 1 },
                        ]}
                    />
                ))}
                {/* Scrolling lane dashes */}
                {stripes.map((y, idx) => (
                    <View key={idx} style={[styles.dashMark, { top: y, left: LANE_W + LANE_GAP / 2 - 2 }]} />
                ))}
                {stripes.map((y, idx) => (
                    <View key={`r${idx}`} style={[styles.dashMark, { top: y, left: 2 * (LANE_W + LANE_GAP) + LANE_GAP / 2 - 2 }]} />
                ))}
            </View>

            {/* ── HEADER ── */}
            <SafeAreaView style={styles.headerSafe}>
                <View style={styles.header}>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>SCORE</Text>
                        <Text style={styles.statVal}>{displayScore}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>LV</Text>
                        <Text style={[styles.statVal, { color: '#ffca28' }]}>{level.current}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>COINS</Text>
                        <Text style={[styles.statVal, { color: '#ffd54f' }]}>🪙 {coins.current}</Text>
                    </View>
                    <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
                        <Text style={styles.pauseText}>{paused.current ? "▶️" : "⏸️"}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── ITEMS (Obstacles & Coins) ── */}
            {items.current.map((item, i) => {
                const ix = laneX(item.lane);
                if (item.type === 'coin') {
                    return (
                        <View key={i} style={[styles.coin, { left: ix - COIN_SIZE / 2, top: item.y }]}>
                            <Text style={styles.coinText}>🪙</Text>
                        </View>
                    );
                } else if (item.type === 'low') {
                    return (
                        <View key={i} style={[styles.obstacleLow, { left: ix - LANE_W / 2 + 5, top: item.y, width: LANE_W - 10 }]}>
                            <View style={styles.obsInner}>
                                <View style={styles.obsStripe} />
                            </View>
                        </View>
                    );
                } else {
                    // high
                    return (
                        <View key={i} style={[styles.obstacleHigh, { left: ix - LANE_W / 2 + 5, top: item.y, width: LANE_W - 10 }]}>
                            <View style={styles.obsHighBar} />
                            <View style={styles.obsHighLeg} />
                            <View style={[styles.obsHighLeg, { right: 5, left: undefined }]} />
                        </View>
                    );
                }
            })}

            {/* ── PLAYER ── */}
            <View style={[
                styles.player,
                {
                    left: playerX,
                    top: playerY - PLAYER_H,
                    width: PLAYER_W,
                    height: sliding.current ? PLAYER_H / 2 : PLAYER_H,
                },
                sliding.current && { top: playerY - PLAYER_H / 2 },
            ]}>
                {/* Runner body */}
                <View style={styles.runnerHead} />
                <View style={[styles.runnerBody, sliding.current && { height: 12 }]} />
                {!sliding.current && (
                    <>
                        <View style={[styles.runnerLeg, { left: 8 }]} />
                        <View style={[styles.runnerLeg, { right: 8 }]} />
                    </>
                )}
            </View>

            {/* ── CONTROLS HINT ── */}
            {playing.current && !dead.current && (
                <View style={styles.hintBar}>
                    <Text style={styles.hintText}>← SWIPE → to dodge  |  ↑ JUMP  |  ↓ SLIDE</Text>
                </View>
            )}

            {/* ── START SCREEN ── */}
            {!playing.current && !dead.current && (
                <View style={styles.overlay}>
                    <Text style={{ fontSize: 55 }}>🏃</Text>
                    <Text style={styles.oTitle}>TEMPLE RUN</Text>
                    <Text style={styles.oSub}>Swipe to dodge obstacles!</Text>
                    <View style={styles.instructions}>
                        <Text style={styles.instrText}>← → Change lane</Text>
                        <Text style={styles.instrText}>↑ Jump over low obstacles</Text>
                        <Text style={styles.instrText}>↓ Slide under high obstacles</Text>
                        <Text style={styles.instrText}>🪙 Collect coins for bonus!</Text>
                    </View>
                    <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                        <Text style={styles.playBtnText}>RUN!</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── PAUSE SCREEN ── */}
            {paused.current && (
                <View style={styles.overlay}>
                    <View style={styles.goCard}>
                        <Text style={styles.goTitle}>PAUSED</Text>
                        <View style={styles.goRow}>
                            <TouchableOpacity style={[styles.goBtn, { backgroundColor: '#e53935' }]} onPress={() => navigation.goBack()}>
                                <Text style={styles.goBtnText}>EXIT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.goBtn, { backgroundColor: '#43a047' }]} onPress={togglePause}>
                                <Text style={styles.goBtnText}>RESUME</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* ── GAME OVER ── */}
            {dead.current && (
                <View style={styles.overlay}>
                    <View style={styles.goCard}>
                        <Text style={styles.goTitle}>GAME OVER</Text>
                        <Text style={styles.goScore}>Score: {displayScore}</Text>
                        <Text style={styles.goDetail}>Coins: {coins.current}  •  Level: {level.current}</Text>
                        <View style={styles.goRow}>
                            <TouchableOpacity style={[styles.goBtn, { backgroundColor: '#e53935' }]} onPress={() => navigation.goBack()}>
                                <Text style={styles.goBtnText}>EXIT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.goBtn, { backgroundColor: '#43a047' }]} onPress={startGame}>
                                <Text style={styles.goBtnText}>RETRY</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b5e20',
    },

    // Track
    track: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: '#37474f',
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderColor: '#fff3',
    },
    laneDivider: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dashMark: {
        position: 'absolute',
        width: 4,
        height: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
    },

    // Header
    headerSafe: {
        zIndex: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    stat: { alignItems: 'center' },
    statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 'bold' },
    statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 'bold' },
    statVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    pauseBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
    pauseText: { fontSize: 16 },

    // Player
    player: {
        position: 'absolute',
        alignItems: 'center',
        zIndex: 50,
    },
    runnerHead: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffcc80',
        marginBottom: 2,
    },
    runnerBody: {
        width: 22,
        height: 22,
        backgroundColor: '#e53935',
        borderRadius: 4,
    },
    runnerLeg: {
        position: 'absolute',
        bottom: 0,
        width: 8,
        height: 12,
        backgroundColor: '#1565c0',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },

    // Obstacles
    obstacleLow: {
        position: 'absolute',
        height: OBSTACLE_H,
        backgroundColor: '#8d6e63',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 40,
        borderWidth: 2,
        borderColor: '#5d4037',
    },
    obsInner: {
        width: '80%',
        height: '60%',
        backgroundColor: '#6d4c41',
        borderRadius: 2,
        overflow: 'hidden',
    },
    obsStripe: {
        width: '100%',
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginTop: 4,
    },
    obstacleHigh: {
        position: 'absolute',
        height: OBSTACLE_H + 20,
        zIndex: 40,
    },
    obsHighBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 14,
        backgroundColor: '#ff7043',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#e64a19',
    },
    obsHighLeg: {
        position: 'absolute',
        top: 14,
        left: 5,
        width: 6,
        height: OBSTACLE_H + 6,
        backgroundColor: '#a1887f',
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    },

    // Coins
    coin: {
        position: 'absolute',
        width: COIN_SIZE,
        height: COIN_SIZE,
        zIndex: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinText: {
        fontSize: 18,
    },

    // Hint
    hintBar: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    hintText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        fontWeight: 'bold',
    },

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(27,94,32,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
    },
    oTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
        marginBottom: 5,
    },
    oSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 15,
    },
    instructions: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
    },
    instrText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginBottom: 4,
    },
    playBtn: {
        backgroundColor: '#ff9800',
        paddingVertical: 14,
        paddingHorizontal: 50,
        borderRadius: 30,
        elevation: 5,
    },
    playBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Game Over
    goCard: {
        backgroundColor: '#1b3a1f',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        minWidth: 250,
    },
    goTitle: { fontSize: 24, fontWeight: 'bold', color: '#e53935', marginBottom: 8 },
    goScore: { fontSize: 22, color: '#fff', marginBottom: 4 },
    goDetail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
    goRow: { flexDirection: 'row', gap: 15 },
    goBtn: { paddingVertical: 12, paddingHorizontal: 26, borderRadius: 25 },
    goBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
