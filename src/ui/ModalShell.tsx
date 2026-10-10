import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { colors, typography, radius } from '@/src/design';

/** Bottom sheets need extra inset on Android 3-button nav (often reports 0). */
export function sheetBottomInset(insets: { bottom: number }): number {
  if (Platform.OS === 'web') return 0;
  if (Platform.OS === 'android') return Math.max(insets.bottom, 48);
  return Math.max(insets.bottom, 12);
}

/**
 * Shared dialog chrome: dimmed backdrop, centered width-capped card with an accent
 * edge, icon badge header and close button. Keeps modals compact on wide screens.
 */
export function ModalShell({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  accent = colors.lime,
  maxWidth = 440,
  align = 'center',
  hideHeader = false,
  flush = false,
  children,
  footer,
  cardStyle,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: IconName;
  accent?: string;
  maxWidth?: number;
  align?: 'center' | 'top' | 'bottom';
  hideHeader?: boolean;
  flush?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const sheet = align === 'bottom';
  const sheetPadBottom = sheet ? sheetBottomInset(insets) : 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType={sheet ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.backdrop,
          align === 'top' && styles.backdropTop,
          sheet && styles.backdropBottom,
          sheet && sheetPadBottom > 0 && { paddingBottom: sheetPadBottom },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close dialog"
        />
        <View
          style={[
            styles.card,
            { maxWidth: sheet ? undefined : maxWidth },
            sheet && styles.cardBottom,
            cardStyle,
          ]}
        >
          <View style={[styles.accent, { backgroundColor: accent }]} />
          {hideHeader ? null : (
            <View style={styles.header}>
              {icon ? (
                <View style={[styles.badge, { borderColor: accent + '55' }]}>
                  <Icon name={icon} size={16} color={accent} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          )}
          <View style={flush ? undefined : styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,8,6,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropTop: { justifyContent: 'flex-start', paddingTop: 72 },
  backdropBottom: {
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  card: {
    width: '100%',
    backgroundColor: colors.panel,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 48,
    elevation: 24,
  },
  cardBottom: {
    width: '100%',
    maxHeight: '88%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  accent: { height: 3, opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    letterSpacing: -0.3,
    fontFamily: typography.fontFamilySemi,
    fontWeight: '600',
  },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  closeText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  body: { padding: 20, gap: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
