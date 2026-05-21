import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  message: string;
  hint?: string;
  onRetry?: () => void;
}

export function BootScreen({ message, hint, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {!onRetry && <ActivityIndicator size="large" color="#E63946" />}
      <Text style={styles.message}>{message}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  message: {
    marginTop: 16,
    color: '#1D3557',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    marginTop: 12,
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#E63946',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
