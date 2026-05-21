import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserRole } from '../../types';
import { SIGNUP_ROLES } from '../../constants/roles';

interface Props {
  onSelectRole: (role: UserRole) => void;
  errorMessage?: string;
}

export function RoleSelectScreen({ onSelectRole, errorMessage }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Choose your role</Text>
      <Text style={styles.subtitle}>How will you use MurGo?</Text>

      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : null}

      {SIGNUP_ROLES.map((item) => (
        <TouchableOpacity
          key={item.role}
          style={styles.card}
          onPress={() => onSelectRole(item.role)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody}>{item.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  title: {
    color: '#1D3557',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6c757d',
    marginBottom: 24,
  },
  error: {
    color: '#E63946',
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardTitle: {
    color: '#1D3557',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardBody: {
    color: '#6c757d',
    fontSize: 14,
  },
});
