
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const BOARD_SIZE = Math.min(width - 20, 400);
export const CELL_SIZE = BOARD_SIZE / 15;

export const COLORS = {
    RED: '#FF0000',
    GREEN: '#00AA00',
    YELLOW: '#FFD700',
    BLUE: '#0099FF',
    WHITE: '#FFFFFF',
    SAFE: '#E0E0E0',
};

export const TURN_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

// 52-step main path coordinates on 15x15 grid
// Each object is {x, y}
// Index 0-51 are the main path.
// Red starts at index 0. Green at 13. Yellow at 26. Blue at 39.
export const MAIN_PATH = [
    { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 }, // 0-4
    { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 }, // 5-10
    { x: 0, y: 7 }, { x: 0, y: 6 }, // 11-12 (Turn)
    { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, // 13-17
    { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 }, // 18-23
    { x: 7, y: 0 }, { x: 8, y: 0 }, // 24-25 (Turn)
    { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }, // 26-30
    { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, // 31-36
    { x: 14, y: 7 }, { x: 14, y: 8 }, // 37-38 (Turn)
    { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 }, // 39-43
    { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 }, { x: 8, y: 14 }, // 44-49
    { x: 7, y: 14 }, { x: 6, y: 14 }, // 50-51 (Loop back to 0)
];

// Home stretch for each color (positions 51-56 relative to player's path)
// 56 is the center/winner spot
export const HOME_STRETCH = {
    RED: [{ x: 7, y: 13 }, { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 }],
    GREEN: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }],
    YELLOW: [{ x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }],
    BLUE: [{ x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }],
};

export const START_OFFSET = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };

// Safe squares (Global Indicies)
// 0 (Red Start), 8 (Star), 13 (Green Start), 21 (Star), 
// 26 (Yellow Start), 34 (Star), 39 (Blue Start), 47 (Star)
export const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// Helper to get coordinates
export function getXY(color, position) {
    // -1 = Home Base (handled by component, returns null here)
    if (position === -1) return null;

    // 0-50: Main Path
    if (position >= 0 && position <= 50) {
        const globalIdx = (START_OFFSET[color] + position) % 52;
        return MAIN_PATH[globalIdx];
    }

    // 51-56: Home Stretch
    if (position >= 51 && position <= 56) {
        const idx = position - 51;
        return HOME_STRETCH[color][idx]; // 56 is the last one
    }

    return { x: 7, y: 7 }; // center fallback
}
