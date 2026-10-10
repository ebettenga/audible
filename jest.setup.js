jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    throw new Error('sqlite mocked out in jest');
  },
}));
