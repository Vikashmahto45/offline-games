import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    USER_NAME: '@offline_games_user_name',
    SETTINGS_FPS: '@offline_games_fps',
    SETTINGS_SOUND: '@offline_games_sound',
    SETTINGS_LANGUAGE: '@offline_games_language',
    SETTINGS_VIBRATION: '@offline_games_vibration',
};

// User name functions
export const saveUserName = async (name) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
        return true;
    } catch (error) {
        console.error('Error saving user name:', error);
        return false;
    }
};

export const getUserName = async () => {
    try {
        const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
        return name;
    } catch (error) {
        console.error('Error getting user name:', error);
        return null;
    }
};

// Settings functions
export const saveSettings = async (settings) => {
    try {
        if (settings.fps !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_FPS, settings.fps.toString());
        if (settings.soundEnabled !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_SOUND, settings.soundEnabled.toString());
        if (settings.language !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_LANGUAGE, settings.language);
        if (settings.vibrationEnabled !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS_VIBRATION, settings.vibrationEnabled.toString());
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
};

export const getSettings = async () => {
    try {
        const fps = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_FPS);
        const sound = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_SOUND);
        const language = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_LANGUAGE);
        const vibration = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS_VIBRATION);

        return {
            fps: fps ? parseInt(fps) : 60,
            soundEnabled: sound ? sound === 'true' : true,
            language: language || 'English',
            vibrationEnabled: vibration ? vibration === 'true' : true,
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {
            fps: 60,
            soundEnabled: true,
            language: 'English',
            vibrationEnabled: true,
        };
    }
};

// Clear user data (for logout functionality)
export const clearUserData = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);
        return true;
    } catch (error) {
        console.error('Error clearing user data:', error);
        return false;
    }
};
