import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const Constants = {
    GRID_SIZE: 3,
    HOLE_SIZE: width * 0.25,
    MOLE_POP_DURATION: 800, // Time mole stays up
    GAME_DURATION: 30, // Seconds
    POINTS_PER_HIT: 10,
    POINTS_PER_MISS: -5,
};
