import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { theme } from '../styles/theme';
import GameCard from '../components/GameCard';
import UserHeader from '../components/UserHeader';

const HomeScreen = ({ navigation, userName, onNameUpdate }) => {
    const games = [
        { id: 1, title: 'Ludo', icon: '🎲', screen: 'Ludo', gradient: ['#FF6B6B', '#C92A2A'] },
        { id: 2, title: 'Snake Classic', icon: '🐍', screen: 'Snake', gradient: ['#51CF66', '#2F9E44'] },


        { id: 5, title: 'Water Sort Puzzle', icon: '💧', screen: 'WaterSort', gradient: ['#06B6D4', '#0284C7'] },
        { id: 6, title: 'Nuts & Bolts', icon: '🔩', screen: 'NutsBolts', gradient: ['#6366F1', '#4338CA'] },

        { id: 7, title: 'Whac-A-Mole', icon: '🐹', screen: 'WhacAMole', gradient: ['#81c784', '#2e7d32'] },
        { id: 8, title: 'Dino Run', icon: '🦖', screen: 'DinoRun', gradient: ['#78909c', '#37474f'] },
        { id: 9, title: 'Brick Breaker', icon: '🧱', screen: 'BrickBreaker', gradient: ['#e53935', '#b71c1c'] },
        { id: 10, title: 'Tetris', icon: '⬛', screen: 'Tetris', gradient: ['#1565c0', '#0d47a1'] },
        { id: 11, title: 'Temple Run', icon: '🏃', screen: 'TempleRun', gradient: ['#2e7d32', '#1b5e20'] },
        { id: 12, title: 'Flappy Bird', icon: '🐦', screen: 'FlappyBird', gradient: ['#F59E0B', '#F97316'] },
        { id: 13, title: 'Sudoku', icon: '🔢', screen: 'Sudoku', gradient: ['#8B5CF6', '#6D28D9'] },
        { id: 999, title: 'More Games Coming Soon', icon: '🔜', screen: 'ComingSoon', gradient: ['#bdc3c7', '#2c3e50'], isPlaceholder: true },


    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const filteredGames = games.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGamePress = (screen, isPlaceholder) => {
        if (isPlaceholder) return; // Do nothing or show alert
        navigation.navigate(screen);
    };

    const handleProfilePress = () => {
        navigation.navigate('Profile', { userName, onNameUpdate });
    };

    const handleSearchPress = () => {
        setIsSearchVisible(!isSearchVisible);
        if (isSearchVisible) setSearchQuery(''); // Clear on close
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <UserHeader
                    userName={userName}
                    onProfilePress={handleProfilePress}
                    onSearchPress={handleSearchPress}
                />

                {isSearchVisible && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search games..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>
                )}

                <View style={styles.gamesGrid}>
                    {filteredGames.map((game) => (
                        <View key={game.id} style={styles.gameCardWrapper}>
                            <GameCard
                                title={game.title}
                                icon={game.icon}
                                gradient={game.gradient}
                                onPress={() => handleGamePress(game.screen, game.isPlaceholder)}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gameCardWrapper: {
        width: '48%',
        marginBottom: theme.spacing.sm,
    },
    searchContainer: {
        marginBottom: theme.spacing.md,
        paddingHorizontal: 4,
    },
    searchInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
    },
});

export default HomeScreen;
