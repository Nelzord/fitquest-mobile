import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, useColorScheme as useRNColorScheme } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const colorScheme = useRNColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
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
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <ThemedText style={styles.buttonText}>Sign In</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.line} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <MaterialCommunityIcons name="google" size={24} color="white" />
            <ThemedText style={styles.googleButtonText}>Sign in with Google</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push('/(auth)/signup')}
          >
            <ThemedText style={styles.signupText}>
              Don't have an account? <ThemedText style={styles.signupTextBold}>Sign up</ThemedText>
            </ThemedText>
          </TouchableOpacity>
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
  form: {
    gap: 15,
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
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors[colorScheme].border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors[colorScheme].placeholderText,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: Colors[colorScheme].placeholderText,
  },
  signupTextBold: {
    fontWeight: 'bold',
    color: Colors[colorScheme].tint,
  },
}); 