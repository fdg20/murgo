import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
} from 'react-native';
import { useClerk } from '@clerk/clerk-expo';
import { ADMIN_PANEL_URL } from '../../constants/config';

export function AdminMobileScreen() {
  const { signOut } = useClerk();

  const openAdminPanel = () => {
    Linking.openURL(ADMIN_PANEL_URL).catch(() => undefined);
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../../assets/murgo-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>MurGo Admin</Text>
      <Text style={styles.subtitle}>
        Admin accounts use the web dashboard on a computer, not the mobile
        customer app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Open admin panel</Text>
        <Text style={styles.cardBody}>Sign in with the same email at:</Text>
        <Text style={styles.url} selectable>
          {ADMIN_PANEL_URL}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={openAdminPanel}>
          <Text style={styles.primaryBtnText}>Open in browser</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => signOut()}>
          <Text style={styles.outlineBtnText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        To order food, sign out and use a customer, merchant, or rider account.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1D3557',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    color: '#1D3557',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBody: {
    color: '#6c757d',
    fontSize: 14,
    marginBottom: 8,
  },
  url: {
    color: '#E63946',
    fontSize: 14,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 16,
  },
  outlineBtnText: {
    color: '#1D3557',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
  },
  footer: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
});
