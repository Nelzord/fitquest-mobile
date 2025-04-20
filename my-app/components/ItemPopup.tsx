import React from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ItemPopupProps {
  item: {
    image_path: string;
    rarity: string;
  };
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const ItemPopup: React.FC<ItemPopupProps> = ({ item, onClose }) => {
  const scale = new Animated.Value(0);
  const opacity = new Animated.Value(0);

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getItemImage = (imagePath: string) => {
    try {
      // Extract the filename from the full path
      const filename = imagePath.split('/').pop() || '';
      
      const images: { [key: string]: any } = {
        'sweatband.png': require('@/assets/images/items/sweatband.png'),
        'basic_sneakers.png': require('@/assets/images/items/basic_sneakers.png'),
        'cowboy_hat.png': require('@/assets/images/items/cowboy_hat.png'),
        'cowboy_vest.png': require('@/assets/images/items/cowboy_vest.png'),
        'cowboy_boots.png': require('@/assets/images/items/cowboy_boots.png'),
        'rice_hat.png': require('@/assets/images/items/rice_hat.png'),
        'iron_sword.png': require('@/assets/images/items/iron_sword.png'),
        'phantom_cloak.png': require('@/assets/images/items/phantom_cloak.png'),
        'golden_crown.png': require('@/assets/images/items/golden_crown.png'),
        'hard_work_medal.png': require('@/assets/images/items/hardwork_medal.png'),
        'leg_day_band.png': require('@/assets/images/items/leg_day_band.png'),
        'training_cap.png': require('@/assets/images/items/training_cap.png'),
      };
      return images[filename] || null;
    } catch (error) {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.popup,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.closeButton} onTouchEnd={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </View>
        {getItemImage(item.image_path) ? (
          <Image
            source={getItemImage(item.image_path)}
            style={styles.itemImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image" size={64} color="#666" />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  popup: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
}); 