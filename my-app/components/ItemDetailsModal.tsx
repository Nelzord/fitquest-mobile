import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getItemImage } from './EquippedItems';

interface Item {
  id: string;
  name: string;
  slot_type: string;
  rarity: string;
  effect: string;
  image_path: string;
  is_owned: boolean;
  is_equipped: boolean;
}

interface ItemDetailsModalProps {
  item: Item | null;
  onClose: () => void;
  onEquip: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, onClose, onEquip }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!item) return null;

  const rarityColors = {
    common: '#808080',
    uncommon: '#2E8B57',
    rare: '#4169E1',
    epic: '#9932CC',
    legendary: '#FFD700'
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
              <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <View style={styles.itemImageContainer}>
            <Image
              source={getItemImage(item.image_path)}
              style={styles.itemImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.detailsContainer}>
            <View style={[
              styles.rarityBadge,
              { backgroundColor: rarityColors[item.rarity as keyof typeof rarityColors] }
            ]}>
              <ThemedText style={styles.rarityText}>{item.rarity}</ThemedText>
            </View>

            <View style={styles.effectContainer}>
              <ThemedText style={styles.effectLabel}>Effect:</ThemedText>
              <ThemedText style={styles.effectText}>{item.effect}</ThemedText>
            </View>

            {item.is_owned && !item.is_equipped && (
              <TouchableOpacity
                style={[
                  styles.equipButton,
                  { backgroundColor: '#2196F3' }
                ]}
                onPress={onEquip}
              >
                <ThemedText style={styles.equipButtonText}>
                  Equip
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  detailsContainer: {
    gap: 16,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rarityText: {
    color: 'white',
    fontWeight: '600',
  },
  effectContainer: {
    gap: 8,
  },
  effectLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  effectText: {
    fontSize: 14,
    lineHeight: 20,
  },
  equipButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  equipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 