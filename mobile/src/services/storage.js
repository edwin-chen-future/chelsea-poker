import * as SecureStore from 'expo-secure-store';

export async function getItem(key) {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key) {
  return SecureStore.deleteItemAsync(key);
}
