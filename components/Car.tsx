import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/utils/constants';

export function Car(props: { width: number; height: number }) {
  return (
    <View
      style={[
        styles.car,
        {
          width: props.width,
          height: props.height,
        },
      ]}
    >
      <View style={styles.windshield} />
      <View style={styles.stripe} />
    </View>
  );
}

const styles = StyleSheet.create({
  car: {
    borderRadius: 10,
    backgroundColor: COLORS.car,
    borderWidth: 2,
    borderColor: COLORS.carAccent,
    overflow: 'hidden',
  },
  windshield: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    left: '50%',
    marginLeft: -3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});

