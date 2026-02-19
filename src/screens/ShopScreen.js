
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';

const ShopScreen = () => {
    const [coins, setCoins] = useState(0);
    const [unlockedItems, setUnlockedItems] = useState(['theme_default', 'dino_skin_default', 'flappy_skin_default']);
    const [equippedItems, setEquippedItems] = useState({
        theme: 'theme_default',
        dino_skin: 'dino_skin_default',
        flappy_skin: 'flappy_skin_default'
    });

    useFocusEffect(
        useCallback(() => {
            loadShopData();
        }, [])
    );

    const loadShopData = async () => {
        try {
            const storedCoins = await AsyncStorage.getItem('user_coins');
            const storedUnlocked = await AsyncStorage.getItem('unlocked_items');
            const storedEquipped = await AsyncStorage.getItem('equipped_items');

            if (storedCoins) setCoins(parseInt(storedCoins));
            if (storedUnlocked) setUnlockedItems(JSON.parse(storedUnlocked));
            if (storedEquipped) setEquippedItems(JSON.parse(storedEquipped));
        } catch (e) {
            console.error('Error loading shop data:', e);
        }
    };

    const handlePurchase = async (item) => {
        if (unlockedItems.includes(item.id)) {
            // Already unlocked -> Equip
            handleEquip(item);
            return;
        }

        if (coins < item.price) {
            Alert.alert('Not enough coins!', `You need ${item.price - coins} more coins.`);
            return;
        }

        Alert.alert(
            'Purchase Item',
            `Buy ${item.name} for ${item.price} coins?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy', onPress: async () => {
                        const newCoins = coins - item.price;
                        const newUnlocked = [...unlockedItems, item.id];

                        setCoins(newCoins);
                        setUnlockedItems(newUnlocked);

                        await AsyncStorage.setItem('user_coins', newCoins.toString());
                        await AsyncStorage.setItem('unlocked_items', JSON.stringify(newUnlocked));

                        // Auto-equip on purchase
                        handleEquip(item);
                    }
                }
            ]
        );
    };

    const handleEquip = async (item) => {
        const newEquipped = { ...equippedItems, [item.type]: item.id };
        setEquippedItems(newEquipped);
        await AsyncStorage.setItem('equipped_items', JSON.stringify(newEquipped));
        // TODO: Emit event or use context to update app theme/skins immediately
    };

    const shopItems = [
        {
            title: 'App Themes', data: [
                { id: 'theme_default', type: 'theme', name: 'Standard Dark', price: 0, color: ['#1e3c72', '#2a5298'] },
                { id: 'theme_matrix', type: 'theme', name: 'Matrix Code', price: 500, color: ['#000000', '#0f9b0f'] },
                { id: 'theme_neon', type: 'theme', name: 'Cyber Neon', price: 1000, color: ['#200122', '#6f0000'] },
                { id: 'theme_sunset', type: 'theme', name: 'Retro Sunset', price: 800, color: ['#4e54c8', '#8f94fb'] },
            ]
        },
        {
            title: 'Dino Skins 🦖', data: [
                { id: 'dino_skin_default', type: 'dino_skin', name: 'Classic T-Rex', price: 0, icon: '🦖' },
                { id: 'dino_skin_red', type: 'dino_skin', name: 'Red Runner', price: 300, icon: '🦖', tint: '#e53935' },
                { id: 'dino_skin_tux', type: 'dino_skin', name: 'Fancy Tuxedo', price: 600, icon: '🕴️' },
            ]
        },
        {
            title: 'Flappy Skins 🐦', data: [
                { id: 'flappy_skin_default', type: 'flappy_skin', name: 'Classic Bird', price: 0, icon: '🐦' },
                { id: 'flappy_skin_gold', type: 'flappy_skin', name: 'Golden Bird', price: 1000, icon: '👑' },
                { id: 'flappy_skin_nyan', type: 'flappy_skin', name: 'Rainbow Cat', price: 1500, icon: '🐱' },
            ]
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.colors.backgroundGradient} style={StyleSheet.absoluteFill} />

            {/* Header / Wallet */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Shoppe 🛍️</Text>
                <View style={styles.coinBadge}>
                    <Text style={styles.coinText}>{coins} 🪙</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {(shopItems || []).map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.itemsGrid}>
                            {(section.data || []).map((item) => {
                                const isUnlocked = unlockedItems.includes(item.id);
                                const isEquipped = equippedItems[item.type] === item.id;

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}
                                        onPress={() => handlePurchase(item)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={item.color || ['#333', '#444']}
                                            style={styles.itemPreview}
                                        >
                                            {item.icon && <Text style={{ fontSize: 32 }}>{item.icon}</Text>}
                                            {isEquipped && <View style={styles.equippedBadge}><Text style={styles.equippedText}>EQUIPPED</Text></View>}
                                            {!isUnlocked && (
                                                <View style={styles.lockOverlay}>
                                                    <Text style={{ fontSize: 20 }}>🔒</Text>
                                                </View>
                                            )}
                                        </LinearGradient>

                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={[styles.itemPrice, isUnlocked && { color: '#4caf50' }]}>
                                                {isUnlocked ? (isEquipped ? 'Active' : 'Own') : `${item.price} 🪙`}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'monospace',
    },
    coinBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'gold',
    },
    coinText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffd700',
    },
    scrollContent: { paddingBottom: 100 },
    section: { marginBottom: 30, paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 15,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    itemCard: {
        width: '47%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    itemCardEquipped: {
        borderColor: '#4caf50',
        borderWidth: 2,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    itemPreview: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        padding: 12,
    },
    itemName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    itemPrice: {
        color: '#ffd700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    equippedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4caf50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    equippedText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
});

export default ShopScreen;
