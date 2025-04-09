import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, useColorScheme as useRNColorScheme } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login, loginAsGuest } = useAuth();
  const colorScheme = useRNColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to login as guest. Please try again.');
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="figure.walk" size={60} color={Colors[colorScheme].tint} />
          <ThemedText type="title" style={styles.title}>Welcome to FitQuest</ThemedText>
          <ThemedText style={styles.subtitle}>Track your fitness journey</ThemedText>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors[colorScheme].placeholderText}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors[colorScheme].placeholderText}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
        >
          <ThemedText style={styles.buttonText}>Login</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={handleGuestLogin}
        >
          <ThemedText style={styles.guestButtonText}>Continue as Guest</ThemedText>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <ThemedText>Don't have an account? </ThemedText>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <ThemedText style={styles.signupLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors[colorScheme].placeholderText,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 15,
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors[colorScheme].border,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors[colorScheme].text,
    backgroundColor: Colors[colorScheme].secondaryBackground,
  },
  button: {
    backgroundColor: Colors[colorScheme].tint,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors[colorScheme].tint,
    marginBottom: 15,
  },
  guestButtonText: {
    color: Colors[colorScheme].tint,
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupLink: {
    color: Colors[colorScheme].tint,
    fontWeight: 'bold',
  },
}); 