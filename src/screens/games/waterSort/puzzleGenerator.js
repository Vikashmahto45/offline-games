// Color palette with gradients (Start Color, End Color)
export const COLORS = [
    ['#EF4444', '#B91C1C'], // Red
    ['#3B82F6', '#1D4ED8'], // Blue
    ['#10B981', '#047857'], // Green
    ['#F59E0B', '#B45309'], // Orange
    ['#8B5CF6', '#6D28D9'], // Purple
    ['#EC4899', '#BE185D'], // Pink
    ['#14B8A6', '#0F766E'], // Teal
    ['#F97316', '#C2410C'], // Dark Orange
    ['#6366F1', '#4338CA'], // Indigo
    ['#84CC16', '#4D7C0F'], // Lime
    ['#F43F5E', '#E11D48'], // Rose
    ['#06B6D4', '#0891B2'], // Cyan
];

// Difficulty configurations
export const DIFFICULTY_CONFIG = {
    easy: {
        totalTubes: 5,
        colorCount: 3,
        emptyTubes: 2,
        mixingSteps: 100, // Increased mixing
        unitsPerColor: 4,
    },
    medium: {
        totalTubes: 7,
        colorCount: 5,
        emptyTubes: 2,
        mixingSteps: 200, // Increased mixing
        unitsPerColor: 4,
    },
    hard: {
        totalTubes: 12,
        colorCount: 10,
        emptyTubes: 2,
        mixingSteps: 500, // Significant increase
        unitsPerColor: 4,
    },
};

/**
 * Generate a solvable puzzle using backward-pour algorithm with improved scrambling
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array} - Array of tubes (each tube is an array of color gradients)
 */
export const generatePuzzle = (difficulty) => {
    const config = DIFFICULTY_CONFIG[difficulty || 'medium']; // Default to medium
    const { totalTubes, colorCount, emptyTubes, mixingSteps, unitsPerColor } = config;

    // Step 1: Start with solved state - each color has its own tube
    let tubes = [];

    // Add filled tubes (one per color)
    for (let i = 0; i < colorCount; i++) {
        const tube = [];
        for (let j = 0; j < unitsPerColor; j++) {
            tube.push(COLORS[i]);
        }
        tubes.push(tube);
    }

    // Add empty buffer tubes
    for (let i = 0; i < emptyTubes; i++) {
        tubes.push([]);
    }

    // Step 2: Perform intense random backward pours to mix colors
    // We simulate valid pours in reverse to ensure the puzzle remains solvable?
    // actually, sorting means separating mixed colors. 
    // So "unsorting" means putting DIFFERENT colors on top of each other.
    // We must ignore the "match color" rule during generation to create mixed tubes.
    let attempts = 0;
    while (attempts < mixingSteps) {
        const fromIndex = Math.floor(Math.random() * totalTubes);
        const toIndex = Math.floor(Math.random() * totalTubes);

        if (fromIndex === toIndex) continue;

        const fromTube = tubes[fromIndex];
        const toTube = tubes[toIndex];

        // Generation Rule: 
        // 1. Can take from non-empty.
        // 2. Can put into non-full.
        // 3. COLOR MATCHING IS IGNORED (this is how we mix).

        if (fromTube.length > 0 && toTube.length < 4) {
            // Perform the pour
            // Randomly move 1 unit (or more?)
            // Moving 1 unit at a time is best for maximum entropy/scrambling

            toTube.push(fromTube.pop());
            attempts++;
        }
    }

    return tubes;
};

/**
 * Check if a pour is valid (GAMEPLAY RULE)
 * @param {Array} fromTube - Source tube
 * @param {Array} toTube - Destination tube
 * @returns {boolean}
 */
export const canPour = (fromTube, toTube) => {
    // Can't pour from empty tube
    if (fromTube.length === 0) return false;

    // Can't pour into full tube
    if (toTube.length >= 4) return false;

    // Can always pour into empty tube
    if (toTube.length === 0) return true;

    // Can pour if top colors match
    return fromTube[fromTube.length - 1] === toTube[toTube.length - 1];
};

/**
 * Perform a pour operation
 * @param {Array} tubes - Current game state
 * @param {number} fromIndex - Source tube index
 * @param {number} toIndex - Destination tube index
 * @returns {Array} - New game state after pour
 */
export const performPour = (tubes, fromIndex, toIndex) => {
    // Deep copy tubes array
    const newTubes = tubes.map(tube => [...tube]);

    const fromTube = newTubes[fromIndex];
    const toTube = newTubes[toIndex];

    if (!canPour(fromTube, toTube)) {
        return tubes; // Invalid pour, return unchanged
    }

    const color = fromTube[fromTube.length - 1];

    // Move continuous block of same color
    while (
        fromTube.length > 0 &&
        fromTube[fromTube.length - 1] === color &&
        toTube.length < 4
    ) {
        toTube.push(fromTube.pop());
    }

    return newTubes;
};

/**
 * Check if puzzle is solved
 * @param {Array} tubes - Current game state
 * @returns {boolean}
 */
export const checkWin = (tubes) => {
    return tubes.every(tube => {
        // Tube is empty OR tube has 4 units of same color
        if (tube.length === 0) return true;
        if (tube.length !== 4) return false;
        // Check if all units in tube are identical colors (by reference)
        const firstColor = tube[0];
        return tube.every(color => color === firstColor);
    });
};
