
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, PanResponder, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../styles/theme';

// --- GAME CONSTANTS (As per User Requirements) ---
const { width, height } = Dimensions.get('window');

// Grid Config: 20x30 roughly, but we need to fit screen aspect ratio
// To ensure square cells, we calculate cell size based on width
const GRID_COLS = 20;
const CELL_SIZE = Math.floor((width - 40) / GRID_COLS); // 20px margins total
const GRID_ROWS = 30; // Fixed 30 rows as requested

const INITIAL_SPEED = 200;
const MIN_SPEED = 80;
const SPEED_DECREMENT = 10;
const SPEED_THRESHOLD = 5; // Every 5 foods

const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

const COLORS = {
    BACKGROUND: '#1a1a1a', // Dark
    SNAKE_HEAD: '#00ff00', // Bright Green
    SNAKE_BODY: '#00cc00', // Green
    FOOD: '#ff0000',       // Red
    WALL: '#444',
    TEXT: '#ffffff',
    OVERLAY_BG: 'rgba(0,0,0,0.85)',
    FOOTER_BG: '#222',
};

const SnakeScreen = ({ navigation }) => {
    // --- STATE ---
    // Initial Snake: 3 segments, starts at (5,10)
    const [snake, setSnake] = useState([
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 },
    ]);
    const [food, setFood] = useState({ x: 10, y: 10 });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);

    // --- REFS (For Game Loop Stability) ---
    const directionRef = useRef(DIRECTION.RIGHT); // Current moving direction
    const nextDirectionRef = useRef(DIRECTION.RIGHT); // Buffer for input
    const snakeRef = useRef(snake);
    const foodRef = useRef(food);
    const scoreRef = useRef(score);
    const speedRef = useRef(speed);
    const intervalRef = useRef(null);

    // --- INIT & PERSISTENCE ---
    useEffect(() => {
        loadHighScore();
        return () => stopGameLoop();
    }, []);

    // Sync refs with state
    useEffect(() => { snakeRef.current = snake; }, [snake]);
    useEffect(() => { foodRef.current = food; }, [food]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const loadHighScore = async () => {
        try {
            const saved = await AsyncStorage.getItem('SNAKE_HIGHSCORE');
            if (saved) setHighScore(parseInt(saved, 10));
        } catch (e) { console.error('Failed to load high score', e); }
    };

    const saveHighScore = async (newScore) => {
        if (newScore > highScore) {
            setHighScore(newScore);
            try {
                await AsyncStorage.setItem('SNAKE_HIGHSCORE', newScore.toString());
            } catch (e) { console.error('Failed to save high score', e); }
        }
    };

    // --- GAME CONTROL ---
    const startGame = () => {
        // Reset Logic
        const initialSnake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 },
        ];
        setSnake(initialSnake);
        snakeRef.current = initialSnake;

        directionRef.current = DIRECTION.RIGHT;
        nextDirectionRef.current = DIRECTION.RIGHT;

        setScore(0);
        scoreRef.current = 0;

        setSpeed(INITIAL_SPEED);
        speedRef.current = INITIAL_SPEED;

        setIsGameOver(false);
        setIsPaused(false);
        setIsPlaying(true);

        spawnFood(initialSnake);
        startGameLoop(INITIAL_SPEED);
    };

    const startGameLoop = (currentSpeed) => {
        stopGameLoop();
        intervalRef.current = setInterval(gameTick, currentSpeed);
    };

    const stopGameLoop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const togglePause = () => {
        if (isGameOver || !isPlaying) return;
        if (isPaused) {
            setIsPaused(false);
            startGameLoop(speed);
        } else {
            setIsPaused(true);
            stopGameLoop();
        }
    };

    // --- CORE GAME ENGINE ---
    const gameTick = useCallback(() => {
        // 1. Process Input Buffer
        directionRef.current = nextDirectionRef.current;

        const currentSnake = snakeRef.current;
        const currentHead = currentSnake[0];
        const dir = directionRef.current;

        // 2. Calculate New Head
        const newHead = {
            x: currentHead.x + dir.x,
            y: currentHead.y + dir.y,
        };

        // 3. Collision Detection
        // Wall Collision
        if (
            newHead.x < 0 || newHead.x >= GRID_COLS ||
            newHead.y < 0 || newHead.y >= GRID_ROWS
        ) {
            handleGameOver();
            return;
        }
        // Self Collision
        if (currentSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            handleGameOver();
            return;
        }

        // 4. Move & Check Food
        // Note: We construct newSnake. If food eaten, we don't pop tail.
        const newSnake = [newHead, ...currentSnake];

        // Check against current Food Ref
        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            // EAT FOOD
            handleEatFood(newSnake);
        } else {
            // REGULAR MOVE: Remove tail
            newSnake.pop();
            setSnake(newSnake);
        }
    }, []);

    const handleEatFood = (expandedSnake) => {
        const newScore = scoreRef.current + 1;
        setScore(newScore);
        setSnake(expandedSnake); // Grow by keeping tail

        // Spawn New Food
        spawnFood(expandedSnake);

        // Speed Progression
        // "Every 5 foods: Reduce by 10ms"
        if (newScore % SPEED_THRESHOLD === 0) {
            const currentS = speedRef.current;
            // Formula: speed = max(80, 200 - (foodsEaten / 5 * 10))
            // Since we decrement iteratively:
            const newSpeed = Math.max(MIN_SPEED, currentS - SPEED_DECREMENT);
            setSpeed(newSpeed);
            startGameLoop(newSpeed);
        }
    };

    const spawnFood = (currentSnake) => {
        let newFood;
        let isValid = false;
        // Safety break to prevent infinite loop (though rare with 20x30 grid)
        let attempts = 0;
        while (!isValid && attempts < 100) {
            attempts++;
            newFood = {
                x: Math.floor(Math.random() * GRID_COLS),
                y: Math.floor(Math.random() * GRID_ROWS),
            };
            // Check overlap
            const overlap = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
            if (!overlap) isValid = true;
        }
        setFood(newFood);
    };

    const handleGameOver = () => {
        stopGameLoop();
        setIsPlaying(false);
        setIsGameOver(true);
        saveHighScore(scoreRef.current);
        // Optional: Vibration or Sound here
    };

    // --- INPUT & GESTURES ---
    const handleInput = (newDir) => {
        const currentDir = directionRef.current;

        // Validate: Cannot reverse
        const isOpposite = (
            (newDir === DIRECTION.UP && currentDir === DIRECTION.DOWN) ||
            (newDir === DIRECTION.DOWN && currentDir === DIRECTION.UP) ||
            (newDir === DIRECTION.LEFT && currentDir === DIRECTION.RIGHT) ||
            (newDir === DIRECTION.RIGHT && currentDir === DIRECTION.LEFT)
        );

        if (!isOpposite) {
            nextDirectionRef.current = newDir;
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const SWIPE_THRESHOLD = 20; // Minimum swipe distance

                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal
                    if (Math.abs(dx) > SWIPE_THRESHOLD) {
                        handleInput(dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT);
                    }
                } else {
                    // Vertical
                    if (Math.abs(dy) > SWIPE_THRESHOLD) {
                        handleInput(dy > 0 ? DIRECTION.DOWN : DIRECTION.UP);
                    }
                }
            },
        })
    ).current;

    // --- RENDER HELPERS ---
    const renderGrid = () => {
        // We only render active elements to save performance, 
        // but we render the border container.
        return (
            <View
                style={[
                    s.gridContainer,
                    { width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE }
                ]}
            >
                {/* Food */}
                <View
                    style={[
                        s.cell,
                        s.food,
                        { left: food.x * CELL_SIZE, top: food.y * CELL_SIZE }
                    ]}
                />

                {/* Snake segments */}
                {snake.map((seg, i) => (
                    <View
                        key={`snake-${i}`} // Index safe as we rebuild
                        style={[
                            s.cell,
                            {
                                left: seg.x * CELL_SIZE,
                                top: seg.y * CELL_SIZE,
                                backgroundColor: i === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY,
                                zIndex: i === 0 ? 10 : 5,
                                borderRadius: i === 0 ? 4 : 2, // Head slightly rounder
                            }
                        ]}
                    >
                        {/* Optional: Eyes for Head */}
                        {i === 0 && (
                            <View style={s.eyesContainer}>
                                <View style={s.eye} />
                                <View style={s.eye} />
                            </View>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={s.container}>
            <StatusBar hidden={true} />
            {/* Game Area with PanResponder */}
            <View style={s.gameArea} {...panResponder.panHandlers}>
                {renderGrid()}

                {/* Overlays */}
                {!isPlaying && !isGameOver && (
                    <View style={s.overlay}>
                        <Text style={s.title}>SNAKE</Text>
                        <TouchableOpacity style={s.btnPrimary} onPress={startGame}>
                            <Text style={s.btnText}>TAP TO START</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isPaused && (
                    <View style={s.overlay}>
                        <Text style={s.title}>PAUSED</Text>
                        <TouchableOpacity style={s.btnPrimary} onPress={togglePause}>
                            <Text style={s.btnText}>RESUME</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isGameOver && (
                    <View style={s.overlay}>
                        <Text style={[s.title, { color: 'red' }]}>GAME OVER</Text>
                        <Text style={s.finalScore}>Score: {score}</Text>
                        <TouchableOpacity style={s.btnPrimary} onPress={startGame}>
                            <Text style={s.btnText}>PLAY AGAIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.goBack()}>
                            <Text style={s.btnText}>EXIT</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Footer with Score and Pause */}
            <View style={s.footer}>
                <View style={s.scoreBox}>
                    <Text style={s.scoreLabel}>SCORE</Text>
                    <Text style={s.scoreValue}>{score}</Text>
                </View>

                {/* Pause Button (Icon) */}
                <TouchableOpacity
                    style={s.pauseBtn}
                    onPress={togglePause}
                    disabled={!isPlaying || isGameOver}
                >
                    <Text style={{ fontSize: 24, color: isPaused ? '#f00' : '#fff' }}>{isPaused ? '▶️' : '⏸️'}</Text>
                </TouchableOpacity>

                <View style={s.scoreBox}>
                    <Text style={s.scoreLabel}>BEST</Text>
                    <Text style={s.scoreValue}>{highScore}</Text>
                </View>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BACKGROUND, alignItems: 'center' },

    scoreBox: { alignItems: 'center', minWidth: 60 },
    scoreLabel: { color: '#888', fontSize: 10, fontWeight: 'bold' },
    scoreValue: { color: COLORS.TEXT, fontSize: 24, fontWeight: 'bold' },

    gameArea: {
        flex: 1, // Take available space
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridContainer: {
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: COLORS.WALL,
        position: 'relative',
    },
    cell: {
        position: 'absolute',
        width: CELL_SIZE - 1, // -1 for grid effect gap
        height: CELL_SIZE - 1,
    },
    food: {
        backgroundColor: COLORS.FOOD,
        borderRadius: CELL_SIZE / 2, // Circle
    },
    eyesContainer: {
        flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'
    },
    eye: {
        width: 4, height: 4, backgroundColor: 'black', borderRadius: 2
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.OVERLAY_BG,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: COLORS.SNAKE_HEAD,
        marginBottom: 20,
        letterSpacing: 4,
    },
    finalScore: {
        fontSize: 24,
        color: 'white',
        marginBottom: 30,
    },
    btnPrimary: {
        backgroundColor: COLORS.SNAKE_BODY,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        minWidth: 200,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 5,
    },
    btnSecondary: {
        backgroundColor: '#555',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        minWidth: 200,
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
        paddingBottom: 40,
        backgroundColor: COLORS.FOOTER_BG,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    pauseBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#555',
    },
});

export default SnakeScreen;
