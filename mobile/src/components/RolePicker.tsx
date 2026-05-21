import { View, Text, TouchableOpacity } from 'react-native';
import { SIGNUP_ROLES, SignupRole } from '../constants/roles';

interface Props {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  compact?: boolean;
}

export function RolePicker({ value, onChange, compact = false }: Props) {
  return (
    <View className={compact ? 'mb-4' : 'mb-6'}>
      <Text
        className={`text-secondary font-semibold ${compact ? 'text-sm mb-2' : 'text-base mb-3'}`}
      >
        I am signing up as
      </Text>
      {SIGNUP_ROLES.map((item) => {
        const selected = value === item.role;
        return (
          <TouchableOpacity
            key={item.role}
            className={`rounded-xl border px-4 py-3 mb-2 ${
              selected
                ? 'border-primary bg-orange-50'
                : 'border-gray-200 bg-white'
            }`}
            onPress={() => onChange(item.role)}
          >
            <Text
              className={`font-semibold ${selected ? 'text-primary' : 'text-secondary'}`}
            >
              {item.title}
            </Text>
            {!compact ? (
              <Text className="text-gray-500 text-sm mt-0.5">{item.description}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
