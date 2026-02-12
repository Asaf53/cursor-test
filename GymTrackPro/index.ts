// Polyfill crypto.getRandomValues for the uuid package in React Native
import { getRandomValues } from 'expo-crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {};
}
if (typeof globalThis.crypto.getRandomValues === 'undefined') {
  globalThis.crypto.getRandomValues = getRandomValues as any;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
