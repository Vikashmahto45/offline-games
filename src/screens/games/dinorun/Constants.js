import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const GROUND_Y = height - 200;
export const DINO_SIZE = 50;
export const DINO_X = 50;
export const JUMP_VELOCITY = -15;
export const GRAVITY = 0.8;
export const GAME_SPEED_START = 4;
export const GAME_SPEED_MAX = 12;
export const CACTUS_WIDTH = 22;
export const CACTUS_HEIGHT = 45;
export const BIRD_WIDTH = 35;
export const BIRD_HEIGHT = 25;
