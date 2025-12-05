import { vi } from 'vitest';

// Mock for react-native
export const Alert = {
    alert: vi.fn(),
};

export const Platform = {
    OS: 'ios',
    select: vi.fn((obj) => obj.ios),
};

export const StyleSheet = {
    create: (obj: any) => obj,
};

export const View = 'View';
export const Text = 'Text';
export const ScrollView = 'ScrollView';
export const RefreshControl = 'RefreshControl';

export default {
    Alert,
    Platform,
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
};
