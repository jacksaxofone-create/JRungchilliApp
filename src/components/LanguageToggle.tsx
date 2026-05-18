// @ts-nocheck
import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useAppStore} from '../core/store/appStore';
import {Language} from '../types';

const LANGUAGES: {code: Language; label: string; flag: string}[] = [
  {code: 'mm', label: 'မြန်မာ', flag: '🇲🇲'},
  {code: 'en', label: 'English', flag: '🇬🇧'},
  {code: 'cn', label: '中文', flag: '🇨🇳'},
];

export const LanguageToggle: React.FC = () => {
  const {secondaryLanguage, setSecondaryLanguage} = useAppStore();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🇹🇭 ไทย +</Text>
      {LANGUAGES.map(lang => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.btn,
            secondaryLanguage === lang.code && styles.btnActive,
          ]}
          onPress={() => setSecondaryLanguage(lang.code)}>
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text
            style={[
              styles.btnText,
              secondaryLanguage === lang.code && styles.btnTextActive,
            ]}>
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a472a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  label: {color: '#fff', fontSize: 12, fontWeight: '600'},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 3,
  },
  btnActive: {backgroundColor: '#f59e0b'},
  flag: {fontSize: 12},
  btnText: {color: '#ccc', fontSize: 11},
  btnTextActive: {color: '#1a1a1a', fontWeight: '700'},
});
