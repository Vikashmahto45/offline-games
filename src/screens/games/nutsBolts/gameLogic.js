// Game Logic for Nuts & Bolts Sort

// Color palette for mechanical/industrial look
const COLORS = [
    ['#EF4444', '#991B1B'], // Red
    ['#3B82F6', '#1E40AF'], // Blue
    ['#10B981', '#065F46'], // Green
    ['#F59E0B', '#92400E'], // Amber
    ['#8B5CF6', '#5B21B6'], // Purple
    ['#EC4899', '#9D174D'], // Pink
    ['#14B8A6', '#0F766E'], // Teal
    ['#6366F1', '#3730A3'], // Indigo
];

const DIFFICULTY_CONFIG = {
    easy: { bolts: 4, colors: 3, capacity: 4, empty: 1, scramble: 50 },
    medium: { bolts: 6, colors: 4, capacity: 4, empty: 2, scramble: 150 },
    hard: { bolts: 9, colors: 7, capacity: 4, empty: 2, scramble: 300 },
};

/**
 * Generate a solvable Nuts & Bolts puzzle
 */
export const generateLevel = (difficulty = 'medium') => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const { bolts: totalBolts, colors: colorCount, capacity, empty, scramble } = config;

    // 1. Create Solved State
    let state = [];

    // Filled bolts
    for (let c = 0; c < colorCount; c++) {
        const bolt = [];
        for (let i = 0; i < capacity; i++) {
            bolt.push(COLORS[c]);
        }
        state.push(bolt);
    }

    // Empty bolts
    const fullBolts = state.length;
    const neededEmpty = Math.max(empty, totalBolts - fullBolts);
    for (let i = 0; i < neededEmpty; i++) {
        state.push([]);
    }

    // 2. Scramble using valid reverse moves (Reverse Sort)
    // Rule: Move top nut from A to B if B has space. 
    // Ignore color matching to ensure mixing.
    let moves = 0;
    while (moves < scramble) {
        const fromIdx = Math.floor(Math.random() * state.length);
        const toIdx = Math.floor(Math.random() * state.length);

        if (fromIdx === toIdx) continue;

        const fromBolt = state[fromIdx];
        const toBolt = state[toIdx];

        if (fromBolt.length > 0 && toBolt.length < capacity) {
            toBolt.push(fromBolt.pop());
            moves++;
        }
    }

    return { bolts: state, config };
};

/**
 * Check if a move is valid
 */
export const isValidMove = (bolts, fromIndex, toIndex, capacity = 4) => {
    if (fromIndex === toIndex) return false;

    const fromBolt = bolts[fromIndex];
    if (fromBolt.length === 0) return false;

    const toBolt = bolts[toIndex];
    if (toBolt.length >= capacity) return false; // Full

    if (toBolt.length === 0) return true; // Empty target

    // Check color matching
    const nut = fromBolt[fromBolt.length - 1]; // Top nut
    const top = toBolt[toBolt.length - 1]; // Top of target

    // Assuming colors are arrays [light, dark]. Compare references or string values.
    return nut === top;
};

/**
 * Check win condition
 */
export const checkWin = (bolts, capacity = 4) => {
    return bolts.every(bolt => {
        if (bolt.length === 0) return true;
        if (bolt.length !== capacity) return false;

        // Check uniformity
        const first = bolt[0];
        return bolt.every(n => n === first);
    });
};
