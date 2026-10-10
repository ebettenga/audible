import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Logo,
  IconButton,
  Avatar,
  Icon,
  type IconName,
} from '@/src/ui';
import { colors, typography, layout, useBreakpoint } from '@/src/design';
import { loadProfile, saveProfile } from '@/src/training';
import { ProfileEditSheet } from '@/src/features/dashboard/ProfileEditSheet';
import { SearchModal } from '@/src/features/dashboard/SearchModal';
import { HelpSheet } from '@/src/features/dashboard/HelpSheet';

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

const TABS: { name: string; label: string; icon: IconName; href: string }[] = [
  { name: 'index', label: 'Build', icon: 'grid', href: '/' },
  { name: 'playbook', label: 'Playbook', icon: 'book', href: '/playbook' },
  { name: 'learn', label: 'Learn', icon: 'layers', href: '/learn' },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function useChromeState() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Offense');
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadProfile().then((profile) => {
      if (cancelled) return;
      setName(profile.name);
      setRole(profile.role || 'Offense');
      if (!promptedRef.current && !profile.name.trim()) {
        promptedRef.current = true;
        setProfileOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSaveProfile = async (next: { name: string; role: string }) => {
    await saveProfile(next);
    setName(next.name);
    setRole(next.role);
    setProfileOpen(false);
  };

  return {
    name,
    role,
    initials: initialsFromName(name || 'Coach'),
    profileOpen,
    setProfileOpen,
    searchOpen,
    setSearchOpen,
    helpOpen,
    setHelpOpen,
    onSaveProfile,
  };
}

function DesktopTopBar({
  name,
  role,
  initials,
  onSearch,
  onHelp,
  onProfile,
}: {
  name: string;
  role: string;
  initials: string;
  onSearch: () => void;
  onHelp: () => void;
  onProfile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(href);
  };

  return (
    <View
      style={[
        styles.topbar,
        {
          paddingTop: Platform.OS === 'web' ? 0 : insets.top,
          height: layout.topbarHeight + (Platform.OS === 'web' ? 0 : insets.top),
        },
      ]}
    >
      <Logo onPress={() => router.push('/')} />
      <View style={styles.nav}>
        {TABS.map((tab) => {
          const focused = isActive(tab.href);
          return (
            <Pressable
              key={tab.name}
              style={[styles.navItem, focused && styles.navItemActive]}
              onPress={() => router.push(tab.href as never)}
            >
              <Text style={[styles.navText, focused && styles.navTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <IconButton name="search" label="Search" onPress={onSearch} />
        <IconButton name="help" label="Help" onPress={onHelp} />
        <Pressable style={styles.profile} onPress={onProfile}>
          <Avatar initials={initials} />
          {!isTablet ? (
            <View>
              <Text style={styles.profileName}>{name.trim() || 'Coach'}</Text>
              <Text style={styles.profileRole}>{role || 'Offense'}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function MobileBottomBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const focused = state.index === state.routes.indexOf(route);
        return (
          <Pressable
            key={tab.name}
            style={styles.bottomItem}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Icon name={tab.icon} size={20} color={focused ? colors.lime : colors.muted} />
            <Text style={[styles.bottomLabel, focused && { color: colors.lime }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isMobile } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const chrome = useChromeState();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {isMobile ? (
        <View style={[styles.mobileTop, { paddingTop: insets.top + 8 }]}>
          <Logo showWordmark={false} />
          <View style={styles.mobileActions}>
            <IconButton
              name="search"
              label="Search"
              onPress={() => chrome.setSearchOpen(true)}
            />
            <IconButton name="help" label="Help" onPress={() => chrome.setHelpOpen(true)} />
            <Pressable onPress={() => chrome.setProfileOpen(true)}>
              <Avatar initials={chrome.initials} />
            </Pressable>
          </View>
        </View>
      ) : (
        <DesktopTopBar
          name={chrome.name}
          role={chrome.role}
          initials={chrome.initials}
          onSearch={() => chrome.setSearchOpen(true)}
          onHelp={() => chrome.setHelpOpen(true)}
          onProfile={() => chrome.setProfileOpen(true)}
        />
      )}
      <Tabs
        tabBar={isMobile ? (props) => <MobileBottomBar {...(props as TabBarProps)} /> : () => null}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Build' }} />
        <Tabs.Screen name="playbook" options={{ title: 'Playbook' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="playground" options={{ href: null, title: 'Playground' }} />
      </Tabs>

      <ProfileEditSheet
        visible={chrome.profileOpen}
        name={chrome.name}
        role={chrome.role}
        onSave={chrome.onSaveProfile}
        onDismiss={() => chrome.setProfileOpen(false)}
      />
      <SearchModal visible={chrome.searchOpen} onClose={() => chrome.setSearchOpen(false)} />
      <HelpSheet visible={chrome.helpOpen} onClose={() => chrome.setHelpOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(13,17,16,0.96)',
  },
  nav: { height: '100%', flexDirection: 'row', gap: 28, flex: 1 },
  navItem: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  navItemActive: { borderBottomColor: colors.lime },
  navText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  navTextActive: { color: colors.text },
  actions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 9 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderMid,
  },
  profileName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    fontFamily: typography.fontFamilyExtra,
  },
  profileRole: { color: colors.faint, fontSize: 10, marginTop: 2 },
  mobileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  mobileActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: 8,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 4 },
  bottomLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
});
