
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';

const ChallengeScreen = ({ navigation }) => {
    const [stats, setStats] = useState({
        dinoScore: 0,
        flappyScore: 0,
        waterSolved: 0,
        templeScore: 0,
        coins: 0,
        claimed: { dino: 0, flappy: 0, water: 0, temple: 0 }
    });

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        try {
            const dino = await AsyncStorage.getItem('dino_hiscore');
            const flappy = await AsyncStorage.getItem('flappy_best_score');
            const water = await AsyncStorage.getItem('watersort_solved_count');
            const temple = await AsyncStorage.getItem('temple_run_hiscore');
            const myCoins = await AsyncStorage.getItem('user_coins');

            // Load CLAIMED milestones (to resume from correct target)
            const claimedDino = await AsyncStorage.getItem('claimed_dino');
            const claimedFlappy = await AsyncStorage.getItem('claimed_flappy');
            const claimedWater = await AsyncStorage.getItem('claimed_water');
            const claimedTemple = await AsyncStorage.getItem('claimed_temple');

            setStats({
                dinoScore: parseInt(dino) || 0,
                flappyScore: parseInt(flappy) || 0,
                waterSolved: parseInt(water) || 0,
                templeScore: parseInt(temple) || 0,
                coins: parseInt(myCoins) || 0,
                claimed: {
                    dino: parseInt(claimedDino) || 0,
                    flappy: parseInt(claimedFlappy) || 0,
                    water: parseInt(claimedWater) || 0,
                    temple: parseInt(claimedTemple) || 0,
                }
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Dynamic Challenge Logic: Calculates the next milestone based on claimed progress
    const getNextTarget = (currentClaimed, step, min = step) => {
        // Target is simply the next step after the last CLAIMED amount
        // If claimed is 0, target is 500.
        // If claimed is 500, target is 1000.
        return currentClaimed + step;
    };

    const dinoTarget = getNextTarget(stats.claimed.dino, 500);
    const flappyTarget = getNextTarget(stats.claimed.flappy, 20);
    const waterTarget = getNextTarget(stats.claimed.water, 5);
    const templeTarget = getNextTarget(stats.claimed.temple, 1000);

    const handleClaim = async (game, reward, target) => {
        const newCoins = stats.coins + reward;
        const newClaimed = { ...stats.claimed, [game]: target };

        setStats(prev => ({
            ...prev,
            coins: newCoins,
            claimed: newClaimed
        }));

        await AsyncStorage.setItem('user_coins', newCoins.toString());
        await AsyncStorage.setItem(`claimed_${game}`, target.toString());

        Alert.alert('Reward Claimed!', `You earned ${reward} coins! 🪙`);
    };

    const dailyChallenges = [
        {
            id: 1,
            title: 'Dino Master',
            game: 'DinoRun',
            gameKey: 'dino',
            goalDesc: `Score ${dinoTarget} points`,
            current: stats.dinoScore,
            target: dinoTarget,
            reward: '50',
            icon: '🦖',
            color: ['#607d8b', '#455a64']
        },
        {
            id: 2,
            title: 'Flappy Pro',
            game: 'FlappyBird',
            gameKey: 'flappy',
            goalDesc: `Pass ${flappyTarget} pipes`,
            current: stats.flappyScore,
            target: flappyTarget,
            reward: '100',
            icon: '🐦',
            color: ['#F59E0B', '#F97316']
        },
        {
            id: 3,
            title: 'Brainiac',
            game: 'WaterSort',
            gameKey: 'water',
            goalDesc: `Solve ${waterTarget} levels`,
            current: stats.waterSolved,
            target: waterTarget,
            reward: '30',
            icon: '💧',
            color: ['#06B6D4', '#0284C7']
        },
        {
            id: 4,
            title: 'Temple Runner',
            game: 'TempleRun',
            gameKey: 'temple',
            goalDesc: `Run ${templeTarget}m`,
            current: stats.templeScore,
            target: templeTarget,
            reward: '60',
            icon: '🏃',
            color: ['#2e7d32', '#1b5e20']
        }
    ];

    // Define Achievements with Logic (Lifetime milestones map)
    const achievements = [
        {
            id: 1,
            title: 'Speed Racer',
            desc: 'Score 2000 in Dino Run',
            progress: `${stats.dinoScore}/2000`,
            completed: stats.dinoScore >= 2000,
            percent: Math.min(stats.dinoScore / 2000, 1)
        },
        {
            id: 2,
            title: 'Flappy Legend',
            desc: 'Score 100 in Flappy Bird',
            progress: `${stats.flappyScore}/100`,
            completed: stats.flappyScore >= 100,
            percent: Math.min(stats.flappyScore / 100, 1)
        },
        {
            id: 3,
            title: 'Puzzle King',
            desc: 'Solve 20 Water Sort levels',
            progress: `${stats.waterSolved}/20`,
            completed: stats.waterSolved >= 20,
            percent: Math.min(stats.waterSolved / 20, 1)
        },
        {
            id: 4,
            title: 'Temple God',
            desc: 'Score 5000 in Temple Run',
            progress: `${stats.templeScore}/5000`,
            completed: stats.templeScore >= 5000,
            percent: Math.min(stats.templeScore / 5000, 1)
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Active Quests 🔥</Text>
                    <Text style={styles.headerSubtitle}>Beat the target to unlock the next level!</Text>
                </View>

                <View style={styles.section}>
                    {(dailyChallenges || []).map((item) => {
                        // Check if specific target is met
                        const isMet = item.current >= item.target;
                        const percent = Math.min((item.current / item.target) * 100, 100);

                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => !isMet && navigation.navigate(item.game)}
                                disabled={isMet} // Disable navigation if claiming
                            >
                                <LinearGradient
                                    colors={isMet ? ['#FFD700', '#FFA000'] : item.color} // Gold if claimable
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.challengeCard}
                                >
                                    <View style={styles.cardIcon}>
                                        <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={[styles.cardGoal, isMet && { color: '#000', fontWeight: 'bold' }]}>
                                            {isMet ? 'GOAL MET!' : item.goalDesc}
                                        </Text>

                                        {!isMet && (
                                            <>
                                                <View style={styles.miniProgress}>
                                                    <View style={[styles.miniFill, { width: `${percent}%` }]} />
                                                </View>
                                                <Text style={styles.progressTextMini}>{item.current} / {item.target}</Text>
                                            </>
                                        )}

                                        {isMet && (
                                            <TouchableOpacity
                                                style={styles.claimBtn}
                                                onPress={() => handleClaim(item.gameKey, parseInt(item.reward), item.target)}
                                            >
                                                <Text style={styles.claimText}>CLAIM REWARD</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {!isMet && (
                                        <View style={styles.rewardBadge}>
                                            <Text style={styles.rewardText}>{item.reward} 🪙</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Achievements Section */}
                <View style={[styles.header, { marginTop: theme.spacing.lg }]}>
                    <Text style={styles.headerTitle}>Achievements 🏆</Text>
                    <Text style={styles.headerSubtitle}>Track your lifetime progress</Text>
                </View>

                <View style={styles.achievementsGrid}>
                    {achievements.map((ach) => (
                        <View key={ach.id} style={[styles.achCard, ach.completed && styles.achCardCompleted]}>
                            <View style={styles.achHeader}>
                                <Text style={styles.achIcon}>{ach.completed ? '🥇' : '🔒'}</Text>
                                <Text style={[styles.achTitle, ach.completed && { color: theme.colors.primary }]}>
                                    {ach.title}
                                </Text>
                            </View>
                            <Text style={styles.achDesc}>{ach.desc}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${ach.percent * 100}%`, backgroundColor: ach.completed ? theme.colors.primary : '#555' }]} />
                            </View>
                            <Text style={styles.progressText}>{ach.completed ? 'Completed' : ach.progress}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.fontSizeXL,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.cardBackground,
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSizeSM,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    section: {
        gap: theme.spacing.md,
    },
    challengeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    cardIcon: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        marginRight: theme.spacing.md,
    },
    cardContent: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: theme.typography.fontSizeMD,
        fontWeight: theme.typography.fontWeightBold,
        color: '#fff',
    },
    cardGoal: {
        fontSize: theme.typography.fontSizeSM,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    miniProgress: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 2,
        marginTop: 6,
        width: '100%',
        overflow: 'hidden',
    },
    miniFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    progressTextMini: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: 'bold',
    },
    rewardBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rewardText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        justifyContent: 'space-between',
    },
    achCard: {
        width: '48%',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    },
    achCardCompleted: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    achHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    achIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    achTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    achDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 10,
        height: 32, // fixed height for alignment
    },
    progressBar: {
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        textAlign: 'right',
    },
    claimBtn: {
        marginTop: 10,
        backgroundColor: '#fff',
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 3,
    },
    claimText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ChallengeScreen;
