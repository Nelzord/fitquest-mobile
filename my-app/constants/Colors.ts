/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Spotify-like Green
const spotifyGreen = '#1DB954'; 
// Darker Backgrounds
const primaryDarkBg = '#121212'; // Very dark grey, almost black
const secondaryDarkBg = '#181818'; // Slightly lighter dark grey
// Light Backgrounds (keeping these simpler)
const primaryLightBg = '#FFFFFF';
const secondaryLightBg = '#F2F2F7'; 
// Text Colors
const textDark = '#FFFFFF';
const textLight = '#1C1C1E'; 
const textMutedDark = '#B3B3B3'; // Muted text for dark bg
const textMutedLight = '#6E6E73'; // Muted text for light bg

export const Colors = {
  light: {
    text: textLight,
    background: primaryLightBg,
    secondaryBackground: secondaryLightBg,
    tint: spotifyGreen, // Use green accent even in light mode
    icon: textMutedLight,
    tabIconDefault: textMutedLight,
    tabIconSelected: spotifyGreen,
    buttonPrimary: spotifyGreen,
    buttonTextPrimary: '#FFFFFF',
    buttonSecondary: '#E5E5EA',
    buttonTextSecondary: textLight,
    inputBackground: '#FFFFFF',
    inputBorder: '#C7C7CC',
    inputText: textLight,
    placeholderText: textMutedLight,
    cardBackground: primaryLightBg,
    borderColor: '#E5E5EA',
    danger: '#FF3B30',
    border: '#e0e0e0',
  },
  dark: {
    text: textDark,
    background: primaryDarkBg,
    secondaryBackground: secondaryDarkBg,
    tint: spotifyGreen,
    icon: textMutedDark,
    tabIconDefault: textMutedDark,
    tabIconSelected: spotifyGreen,
    buttonPrimary: spotifyGreen,
    buttonTextPrimary: '#000000',
    buttonSecondary: '#282828',
    buttonTextSecondary: textDark,
    inputBackground: '#282828',
    inputBorder: '#404040',
    inputText: textDark,
    placeholderText: textMutedDark,
    cardBackground: secondaryDarkBg,
    borderColor: '#3A3A3C',
    danger: '#FF453A',
    border: '#2c2c2e',
  },
};
