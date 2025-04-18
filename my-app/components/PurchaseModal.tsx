import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
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
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }
        ]}>
          <View style={styles.header}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.itemImageContainer,
            { borderColor: rarityColors[item.rarity] },
            { shadowColor: rarityGlowColors[item.rarity] }
          ]}>
            <Image
              source={getItemImage(item.image_path)}
              style={styles.itemImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.rarityContainer}>
            <View style={[
              styles.rarityBadge,
              { backgroundColor: rarityColors[item.rarity] }
            ]}>
              <ThemedText style={styles.rarityText}>{item.rarity}</ThemedText>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Slot:</ThemedText>
              <ThemedText style={styles.detailValue}>{item.slot_type}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Effect:</ThemedText>
              <ThemedText style={styles.detailValue}>{item.effect}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Price:</ThemedText>
              <View style={styles.priceContainer}>
                <Image 
                  source={require('@/assets/images/logos/goldcoin.png')} 
                  style={styles.priceIcon}
                  resizeMode="contain"
                />
                <ThemedText style={styles.priceText}>{item.price}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                userGold < item.price && styles.disabledButton
              ]}
              onPress={handlePurchase}
              disabled={userGold < item.price}
            >
              <ThemedText style={styles.buttonText}>
                {userGold < item.price ? 'Not Enough Gold' : 'Purchase'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  itemImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 5,
    marginBottom: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  rarityContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rarityText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 