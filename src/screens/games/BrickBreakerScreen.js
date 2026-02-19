import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── CONSTANTS ───
const PADDLE_W = 90;
const PADDLE_H = 14;
const PADDLE_Y = SH - 160; // Top of paddle from top
const BALL_SIZE = 14;
const BALL_SPEED = 2.5;
const BRICK_ROWS = 5;
const BRICK_COLS = 6;
const BRICK_H = 22;
const BRICK_GAP = 4;
const BRICK_TOP = 120; // Where bricks start
const BRICK_W = (SW - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
const LIVES_START = 3;

// Brick colors per row
const ROW_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];

// Generate bricks
const makeBricks = () => {
    const bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                id: `${r}-${c}`,
                x: BRICK_GAP + c * (BRICK_W + BRICK_GAP),
                y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
                w: BRICK_W,
                h: BRICK_H,
                color: ROW_COLORS[r % ROW_COLORS.length],
                alive: true,
            });
        }
    }
    return bricks;
};

export default function BrickBreakerScreen({ navigation }) {
    const [, forceUpdate] = useState(0);

    // Game state refs
    const playing = useRef(false);
    const dead = useRef(false);
    const score = useRef(0);
    const lives = useRef(LIVES_START);
    const level = useRef(1);

    // Paddle
    const paddleX = useRef((SW - PADDLE_W) / 2);

    // Ball
    const ballX = useRef(SW / 2 - BALL_SIZE / 2);
    const ballY = useRef(PADDLE_Y - BALL_SIZE - 5);
    const ballDX = useRef(BALL_SPEED);
    const ballDY = useRef(-BALL_SPEED);
    const ballLaunched = useRef(false);

    // Bricks
    const bricks = useRef(makeBricks());

    const loopId = useRef(null);
    const speedMultiplier = useRef(1);

    // ─── PAN RESPONDER (Paddle Drag) ───
    const panRef = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                let newX = gesture.moveX - PADDLE_W / 2;
                newX = Math.max(0, Math.min(SW - PADDLE_W, newX));
                paddleX.current = newX;

                // Ball follows paddle before launch
                if (!ballLaunched.current && playing.current) {
                    ballX.current = newX + PADDLE_W / 2 - BALL_SIZE / 2;
                }
            },
            onPanResponderRelease: () => {
                // Launch ball on first tap/release
                if (playing.current && !ballLaunched.current) {
                    ballLaunched.current = true;
                    ballDX.current = BALL_SPEED * speedMultiplier.current * (Math.random() > 0.5 ? 1 : -1);
                    ballDY.current = -BALL_SPEED * speedMultiplier.current;
                }
            },
        })
    ).current;

    // ─── GAME LOOP ───
    const tick = () => {
        if (dead.current || !playing.current) return;

        if (!ballLaunched.current) {
            forceUpdate(n => n + 1);
            loopId.current = requestAnimationFrame(tick);
            return;
        }

        // Move ball
        ballX.current += ballDX.current;
        ballY.current += ballDY.current;

        // Wall collisions (left/right)
        if (ballX.current <= 0) {
            ballX.current = 0;
            ballDX.current = Math.abs(ballDX.current);
        }
        if (ballX.current >= SW - BALL_SIZE) {
            ballX.current = SW - BALL_SIZE;
            ballDX.current = -Math.abs(ballDX.current);
        }

        // Top wall
        if (ballY.current <= 0) {
            ballY.current = 0;
            ballDY.current = Math.abs(ballDY.current);
        }

        // Bottom (miss) - lose life
        if (ballY.current >= SH - 80) {
            lives.current -= 1;
            if (lives.current <= 0) {
                gameOver();
                return;
            }
            // Reset ball to paddle
            resetBall();
            forceUpdate(n => n + 1);
            loopId.current = requestAnimationFrame(tick);
            return;
        }

        // Paddle collision
        const pLeft = paddleX.current;
        const pRight = paddleX.current + PADDLE_W;
        const pTop = PADDLE_Y;

        if (
            ballDY.current > 0 && // Moving down
            ballY.current + BALL_SIZE >= pTop &&
            ballY.current + BALL_SIZE <= pTop + PADDLE_H + 5 &&
            ballX.current + BALL_SIZE >= pLeft &&
            ballX.current <= pRight
        ) {
            ballDY.current = -Math.abs(ballDY.current);
            ballY.current = pTop - BALL_SIZE;

            // Angle based on where ball hits paddle
            const hitPos = (ballX.current + BALL_SIZE / 2 - pLeft) / PADDLE_W; // 0 to 1
            const angle = (hitPos - 0.5) * 2; // -1 to 1
            ballDX.current = angle * BALL_SPEED * speedMultiplier.current * 1.5;

            // Ensure minimum horizontal speed
            if (Math.abs(ballDX.current) < 1) {
                ballDX.current = ballDX.current >= 0 ? 1 : -1;
            }
        }

        // Brick collisions
        let hitBrick = false;
        for (const brick of bricks.current) {
            if (!brick.alive) continue;

            const bLeft = brick.x;
            const bRight = brick.x + brick.w;
            const bTop = brick.y;
            const bBottom = brick.y + brick.h;

            if (
                ballX.current + BALL_SIZE > bLeft &&
                ballX.current < bRight &&
                ballY.current + BALL_SIZE > bTop &&
                ballY.current < bBottom
            ) {
                brick.alive = false;
                score.current += 10;
                hitBrick = true;

                // Determine bounce direction
                const overlapLeft = ballX.current + BALL_SIZE - bLeft;
                const overlapRight = bRight - ballX.current;
                const overlapTop = ballY.current + BALL_SIZE - bTop;
                const overlapBottom = bBottom - ballY.current;

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapTop || minOverlap === overlapBottom) {
                    ballDY.current = -ballDY.current;
                } else {
                    ballDX.current = -ballDX.current;
                }

                break; // One brick per frame
            }
        }

        // Check if all bricks destroyed → next level!
        const aliveCount = bricks.current.filter(b => b.alive).length;
        if (aliveCount === 0) {
            nextLevel();
            return;
        }

        forceUpdate(n => n + 1);
        loopId.current = requestAnimationFrame(tick);
    };

    // ─── ACTIONS ───
    const resetBall = () => {
        ballLaunched.current = false;
        ballX.current = paddleX.current + PADDLE_W / 2 - BALL_SIZE / 2;
        ballY.current = PADDLE_Y - BALL_SIZE - 5;
        ballDX.current = BALL_SPEED * speedMultiplier.current;
        ballDY.current = -BALL_SPEED * speedMultiplier.current;
    };

    const startGame = () => {
        dead.current = false;
        playing.current = true;
        score.current = 0;
        lives.current = LIVES_START;
        level.current = 1;
        speedMultiplier.current = 1;
        paddleX.current = (SW - PADDLE_W) / 2;
        bricks.current = makeBricks();
        resetBall();

        cancelAnimationFrame(loopId.current);
        loopId.current = requestAnimationFrame(tick);
        forceUpdate(n => n + 1);
    };

    const nextLevel = () => {
        level.current += 1;
        speedMultiplier.current += 0.08;
        bricks.current = makeBricks();
        resetBall();
        forceUpdate(n => n + 1);
        loopId.current = requestAnimationFrame(tick);
    };

    const gameOver = () => {
        dead.current = true;
        playing.current = false;
        cancelAnimationFrame(loopId.current);
        forceUpdate(n => n + 1);
    };

    useEffect(() => {
        return () => cancelAnimationFrame(loopId.current);
    }, []);

    // ─── RENDER ───
    const displayScore = score.current;

    return (
        <View style={styles.container} {...panRef.panHandlers}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SCORE</Text>
                    <Text style={styles.statValue}>{displayScore}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>LEVEL</Text>
                    <Text style={[styles.statValue, { color: '#ffca28' }]}>{level.current}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>LIVES</Text>
                    <Text style={styles.statValue}>{'❤️'.repeat(lives.current)}</Text>
                </View>
            </View>

            {/* Bricks */}
            {bricks.current.map(brick => brick.alive && (
                <View
                    key={brick.id}
                    style={[
                        styles.brick,
                        {
                            left: brick.x,
                            top: brick.y,
                            width: brick.w,
                            height: brick.h,
                            backgroundColor: brick.color,
                        },
                    ]}
                >
                    <View style={styles.brickShine} />
                </View>
            ))}

            {/* Ball */}
            <View
                style={[
                    styles.ball,
                    {
                        left: ballX.current,
                        top: ballY.current,
                    },
                ]}
            />

            {/* Paddle */}
            <View
                style={[
                    styles.paddle,
                    {
                        left: paddleX.current,
                        top: PADDLE_Y,
                    },
                ]}
            >
                <View style={styles.paddleShine} />
            </View>

            {/* Bottom zone indicator */}
            <View style={styles.bottomLine} />

            {/* ── START SCREEN ── */}
            {!playing.current && !dead.current && (
                <View style={styles.overlay}>
                    <Text style={styles.startEmoji}>🧱</Text>
                    <Text style={styles.startTitle}>BRICK BREAKER</Text>
                    <Text style={styles.startSub}>Drag to move paddle</Text>
                    <Text style={styles.startHint}>Release to launch ball!</Text>
                    <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                        <Text style={styles.playBtnText}>PLAY</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── GAME OVER ── */}
            {dead.current && (
                <View style={styles.overlay}>
                    <View style={styles.goCard}>
                        <Text style={styles.goTitle}>GAME OVER</Text>
                        <Text style={styles.goScore}>Score: {displayScore}</Text>
                        <Text style={styles.goLevel}>Level: {level.current}</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },

    // Header
    header: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        zIndex: 100,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Bricks
    brick: {
        position: 'absolute',
        borderRadius: 4,
        overflow: 'hidden',
    },
    brickShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // Ball
    ball: {
        position: 'absolute',
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
        backgroundColor: '#fff',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 5,
    },

    // Paddle
    paddle: {
        position: 'absolute',
        width: PADDLE_W,
        height: PADDLE_H,
        borderRadius: 7,
        backgroundColor: '#42a5f5',
        overflow: 'hidden',
        shadowColor: '#42a5f5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 5,
    },
    paddleShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },

    // Bottom line
    bottomLine: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // Overlays
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26,26,46,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
    },
    startEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    startTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    startSub: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    startHint: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
        marginBottom: 25,
    },
    playBtn: {
        backgroundColor: '#42a5f5',
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
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 260,
    },
    goTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#e53935',
        marginBottom: 10,
    },
    goScore: {
        fontSize: 22,
        color: '#fff',
        marginBottom: 4,
    },
    goLevel: {
        fontSize: 14,
        color: '#ffca28',
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
