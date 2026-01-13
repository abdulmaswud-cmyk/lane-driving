import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/utils/constants';

export function Obstacle(props: { size: number }) {
  return (
    <View style={[styles.box, { width: props.size, height: props.size }]}>
      <View style={styles.inner} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 10,
    backgroundColor: COLORS.obstacle,
    borderWidth: 2,
    borderColor: COLORS.obstacleAccent,
    overflow: 'hidden',
  },
  inner: {
    position: 'absolute',
    inset: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});

