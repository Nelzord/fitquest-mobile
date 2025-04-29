import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getItemImage } from './EquippedItems';

interface Item {
  id: string;
  name: string;
  slot_type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effect: string;
  image_path: string;
  is_owned: boolean;
  is_equipped: boolean;
  price: number;
}

interface PurchaseModalProps {
  item: Item | null;
  userGold: number;
  onClose: () => void;
  onPurchase: (item: Item) => void;
}

const rarityColors = {
  common: '#808080',
  uncommon: '#2E8B57',
  rare: '#4169E1',
  epic: '#9932CC',
  legendary: '#FFD700'
};

const rarityGlowColors = {
  common: 'rgba(128, 128, 128, 0.3)',
  uncommon: 'rgba(46, 139, 87, 0.3)',
  rare: 'rgba(65, 105, 225, 0.3)',
  epic: 'rgba(153, 50, 204, 0.3)',
  legendary: 'rgba(255, 215, 0, 0.3)'
};

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ item, userGold, onClose, onPurchase }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  if (!item) return null;

  const handlePurchase = () => {
    if (userGold < item.price) {
      Alert.alert(
        'Not Enough Gold',
        `You need ${item.price - userGold} more gold to purchase this item.`,
        [{ text: 'OK' }]
      );
      return;
    }
    onPurchase(item);
  };

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.itemImageContainer}>
            <Image
              source={getItemImage(item.image_path)}
              style={styles.itemImage}
              resizeMode="contain"
            />
          </View>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          <ThemedText style={styles.itemRarity}>{item.rarity}</ThemedText>
          <ThemedText style={styles.itemEffect}>{item.effect}</ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={handlePurchase}
              disabled={userGold < item.price}
            >
              <ThemedText style={styles.buttonText}>
                {userGold < item.price ? 'Not Enough Gold' : 'Purchase'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors[colorScheme].borderColor }]}
              onPress={onClose}
            >
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  itemImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '80%',
    height: '80%',
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRarity: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemEffect: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 