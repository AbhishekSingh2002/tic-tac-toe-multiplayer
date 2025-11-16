import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Cell = ({ value, onPress, disabled }) => {
  const getCellStyle = () => {
    if (value === 'X') return styles.cellX;
    if (value === 'O') return styles.cellO;
    return styles.cellEmpty;
  };

  return (
    <TouchableOpacity
      style={[styles.cell, getCellStyle()]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.cellText, value === 'X' ? styles.textX : styles.textO]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: 100,
    height: 100,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
  cellEmpty: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cellX: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  cellO: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  textX: {
    color: '#3B82F6',
  },
  textO: {
    color: '#EF4444',
  },
});

export default Cell;
