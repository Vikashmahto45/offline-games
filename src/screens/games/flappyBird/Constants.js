import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Constants = {
    MAX_WIDTH: width,
    MAX_HEIGHT: height,
    GAP_SIZE: 220, // Slightly wider gap
    PIPE_WIDTH: 60,
    BIRD_WIDTH: 50,
    BIRD_HEIGHT: 40,
    PHYSICS: {
        gravity: 0.7, // Gravity to pull down faster (realistic)
        jumpForce: -10, // Jump force to counter gravity
        speed: 2.5, // Slower pipes for playability
    }
};
