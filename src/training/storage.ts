/**
 * Platform entry: AsyncStorage on web / Jest.
 * On iOS and Android, Metro resolves `storage.native.ts` (expo-sqlite) instead.
 */
export * from './storageAsync';
