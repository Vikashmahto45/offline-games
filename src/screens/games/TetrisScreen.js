import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── CONSTANTS ───
const COLS = 10;
const ROWS = 20;
// Calculate cell size to fit board between header and controls
const HEADER_H = 80;
const CONTROLS_H = 140;
const AVAILABLE_H = SH - HEADER_H - CONTROLS_H - 80; // padding
const CELL = Math.min(Math.floor((SW - 80) / COLS), Math.floor(AVAILABLE_H / ROWS));
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

// ─── TETROMINO SHAPES ───
const PIECES = {
    I: { color: '#00bcd4', rotations: [[[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]]] },
    O: { color: '#ffeb3b', rotations: [[[0, 0], [0, 1], [1, 0], [1, 1]]] },
    T: { color: '#9c27b0', rotations: [[[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [1, 1], [1, 2], [0, 1]], [[0, 0], [1, 0], [2, 0], [1, -1]]] },
    S: { color: '#4caf50', rotations: [[[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]] },
    Z: { color: '#f44336', rotations: [[[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [1, 0], [1, 1], [2, 0]]] },
    J: { color: '#2196f3', rotations: [[[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, -1]]] },
    L: { color: '#ff9800', rotations: [[[0, 2], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 0]], [[0, 0], [0, 1], [1, 1], [2, 1]]] },
};
const PIECE_KEYS = Object.keys(PIECES);

const makeBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const randomPiece = () => {
    const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
    return { key, color: PIECES[key].color, rotation: 0, row: 0, col: Math.floor(COLS / 2) - 1 };
};

const getPieceCells = (piece) => {
    const rotations = PIECES[piece.key].rotations;
    const rot = rotations[piece.rotation % rotations.length];
    return rot.map(([r, c]) => [piece.row + r, piece.col + c]);
};

const isValid = (piece, board) => {
    const cells = getPieceCells(piece);
    for (const [r, c] of cells) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        if (board[r][c]) return false;
    }
    return true;
};

export default function TetrisScreen({ navigation }) {
    const [, forceUpdate] = useState(0);

    const board = useRef(makeBoard());
    const current = useRef(randomPiece());
    const nextPiece = useRef(randomPiece());
    const playing = useRef(false);
    const gameOverFlag = useRef(false);
    const score = useRef(0);
    const linesCleared = useRef(0);
    const level = useRef(1);
    const dropTimer = useRef(null);

    // ─── CORE LOGIC ───
    const lockPiece = useCallback(() => {
        const cells = getPieceCells(current.current);
        for (const [r, c] of cells) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                board.current[r][c] = current.current.color;
            }
        }

        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board.current[r].every(cell => cell !== null)) {
                board.current.splice(r, 1);
                board.current.unshift(Array(COLS).fill(null));
                cleared++;
                r++;
            }
        }

        if (cleared > 0) {
            const points = [0, 100, 300, 500, 800];
            score.current += (points[cleared] || 800) * level.current;
            linesCleared.current += cleared;
            level.current = Math.floor(linesCleared.current / 10) + 1;
        }

        current.current = nextPiece.current;
        nextPiece.current = randomPiece();

        if (!isValid(current.current, board.current)) {
            gameOverFlag.current = true;
            playing.current = false;
            clearInterval(dropTimer.current);
        }

        forceUpdate(n => n + 1);
    }, []);

    const moveDown = useCallback(() => {
        if (!playing.current || gameOverFlag.current) return;
        const next = { ...current.current, row: current.current.row + 1 };
        if (isValid(next, board.current)) {
            current.current = next;
        } else {
            lockPiece();
        }
        forceUpdate(n => n + 1);
    }, [lockPiece]);

    const moveLeft = () => {
        if (!playing.current) return;
        const next = { ...current.current, col: current.current.col - 1 };
        if (isValid(next, board.current)) { current.current = next; forceUpdate(n => n + 1); }
    };

    const moveRight = () => {
        if (!playing.current) return;
        const next = { ...current.current, col: current.current.col + 1 };
        if (isValid(next, board.current)) { current.current = next; forceUpdate(n => n + 1); }
    };

    const rotate = () => {
        if (!playing.current) return;
        const rotations = PIECES[current.current.key].rotations;
        const next = { ...current.current, rotation: (current.current.rotation + 1) % rotations.length };
        if (isValid(next, board.current)) { current.current = next; }
        else {
            const kickL = { ...next, col: next.col - 1 };
            const kickR = { ...next, col: next.col + 1 };
            if (isValid(kickL, board.current)) current.current = kickL;
            else if (isValid(kickR, board.current)) current.current = kickR;
        }
        forceUpdate(n => n + 1);
    };

    const hardDrop = () => {
        if (!playing.current) return;
        let next = { ...current.current };
        while (isValid({ ...next, row: next.row + 1 }, board.current)) next.row += 1;
        current.current = next;
        lockPiece();
    };

    const startGame = () => {
        board.current = makeBoard();
        current.current = randomPiece();
        nextPiece.current = randomPiece();
        score.current = 0;
        linesCleared.current = 0;
        level.current = 1;
        gameOverFlag.current = false;
        playing.current = true;
        clearInterval(dropTimer.current);
        startDropLoop();
        forceUpdate(n => n + 1);
    };

    const startDropLoop = () => {
        clearInterval(dropTimer.current);
        const speed = Math.max(100, 800 - (level.current - 1) * 60);
        dropTimer.current = setInterval(moveDown, speed);
    };

    useEffect(() => {
        if (playing.current) startDropLoop();
        return () => clearInterval(dropTimer.current);
    }, [level.current]);

    useEffect(() => () => clearInterval(dropTimer.current), []);

    // ─── DISPLAY BOARD ───
    const displayBoard = board.current.map(row => [...row]);
    if (!gameOverFlag.current) {
        const cells = getPieceCells(current.current);
        for (const [r, c] of cells) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) displayBoard[r][c] = current.current.color;
        }
        // Ghost
        let ghost = { ...current.current };
        while (isValid({ ...ghost, row: ghost.row + 1 }, board.current)) ghost.row += 1;
        for (const [r, c] of getPieceCells(ghost)) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !displayBoard[r][c]) displayBoard[r][c] = 'ghost';
        }
    }

    const nextCells = getPieceCells({ ...nextPiece.current, row: 0, col: 0 });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* ── HEADER ROW ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.exitText}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>SCORE</Text>
                        <Text style={styles.statVal}>{score.current}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>LV</Text>
                        <Text style={[styles.statVal, { color: '#ffca28' }]}>{level.current}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>LINES</Text>
                        <Text style={styles.statVal}>{linesCleared.current}</Text>
                    </View>
                    {/* Next piece mini */}
                    <View style={styles.nextMini}>
                        <Text style={styles.nextLabel}>NEXT</Text>
                        <View style={styles.nextGrid}>
                            {[0, 1, 2, 3].map(r => (
                                <View key={r} style={{ flexDirection: 'row' }}>
                                    {[0, 1, 2, 3].map(c => {
                                        const filled = nextCells.some(([nr, nc]) => nr === r && nc === c);
                                        return <View key={c} style={[styles.nextCell, filled && { backgroundColor: nextPiece.current.color }]} />;
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── GAME BOARD (centered, flex) ── */}
                <View style={styles.boardWrapper}>
                    <View style={[styles.board, { width: BOARD_W, height: BOARD_H }]}>
                        {displayBoard.map((row, ri) => (
                            <View key={ri} style={styles.row}>
                                {row.map((cell, ci) => (
                                    <View
                                        key={ci}
                                        style={[
                                            styles.cell,
                                            { width: CELL, height: CELL },
                                            cell && cell !== 'ghost' && {
                                                backgroundColor: cell,
                                                borderWidth: 1,
                                                borderTopColor: 'rgba(255,255,255,0.3)',
                                                borderLeftColor: 'rgba(255,255,255,0.2)',
                                                borderRightColor: 'rgba(0,0,0,0.2)',
                                                borderBottomColor: 'rgba(0,0,0,0.3)',
                                            },
                                            cell === 'ghost' && styles.ghostCell,
                                        ]}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── CONTROLS ── */}
                <View style={styles.controls}>
                    <View style={styles.ctrlRow}>
                        <TouchableOpacity style={styles.ctrlBtn} onPress={moveLeft} activeOpacity={0.6}>
                            <Text style={styles.ctrlText}>◀</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: '#e53935' }]} onPress={hardDrop} activeOpacity={0.6}>
                            <Text style={styles.ctrlText}>⬇</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.ctrlBtn} onPress={moveRight} activeOpacity={0.6}>
                            <Text style={styles.ctrlText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.ctrlRow}>
                        <TouchableOpacity style={[styles.ctrlBtn, { flex: 1 }]} onPress={moveDown} activeOpacity={0.6}>
                            <Text style={styles.ctrlText}>▽ DOWN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.ctrlBtn, { flex: 1, backgroundColor: '#1565c0' }]} onPress={rotate} activeOpacity={0.6}>
                            <Text style={styles.ctrlText}>↻ SPIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── START OVERLAY ── */}
                {!playing.current && !gameOverFlag.current && (
                    <View style={styles.overlay}>
                        <Text style={{ fontSize: 50 }}>🧩</Text>
                        <Text style={styles.oTitle}>TETRIS</Text>
                        <Text style={styles.oSub}>Classic Block Puzzle</Text>
                        <TouchableOpacity style={styles.playBtn} onPress={startGame}>
                            <Text style={styles.playBtnText}>PLAY</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── GAME OVER ── */}
                {gameOverFlag.current && (
                    <View style={styles.overlay}>
                        <View style={styles.goCard}>
                            <Text style={styles.goTitle}>GAME OVER</Text>
                            <Text style={styles.goScore}>Score: {score.current}</Text>
                            <Text style={styles.goDetail}>Lines: {linesCleared.current}  •  Level: {level.current}</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a1a',
    },
    container: {
        flex: 1,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    exitBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exitText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    stat: { alignItems: 'center' },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold' },
    statVal: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    nextMini: { alignItems: 'center' },
    nextLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
    nextGrid: {},
    nextCell: { width: 10, height: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },

    // ── Board ──
    boardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    board: {
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: '#111122',
    },
    row: { flexDirection: 'row' },
    cell: {
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    ghostCell: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    // ── Controls ──
    controls: {
        paddingHorizontal: 15,
        paddingBottom: 10,
        paddingTop: 8,
        gap: 8,
    },
    ctrlRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    ctrlBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 65,
    },
    ctrlText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // ── Overlays ──
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,10,26,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
    },
    oTitle: { fontSize: 34, fontWeight: 'bold', color: '#fff', marginTop: 10, marginBottom: 5 },
    oSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 25 },
    playBtn: { backgroundColor: '#1565c0', paddingVertical: 14, paddingHorizontal: 50, borderRadius: 30 },
    playBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    goCard: {
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 250,
    },
    goTitle: { fontSize: 24, fontWeight: 'bold', color: '#e53935', marginBottom: 8 },
    goScore: { fontSize: 22, color: '#fff', marginBottom: 4 },
    goDetail: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
    goRow: { flexDirection: 'row', gap: 15 },
    goBtn: { paddingVertical: 12, paddingHorizontal: 26, borderRadius: 25 },
    goBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
