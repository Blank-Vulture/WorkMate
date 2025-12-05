import { vi } from 'vitest';

// Define globals for Expo
(global as any).__DEV__ = true;

// Mock Expo modules
vi.mock('expo-crypto', () => ({
    randomUUID: () => 'mock-uuid',
}));

vi.mock('expo-sqlite', () => ({
    openDatabaseAsync: vi.fn(),
}));

vi.mock('expo-file-system', () => ({
    documentDirectory: '/mock/document/directory/',
    writeAsStringAsync: vi.fn(),
    readAsStringAsync: vi.fn(),
}));

vi.mock('expo-sharing', () => ({
    shareAsync: vi.fn(),
}));
