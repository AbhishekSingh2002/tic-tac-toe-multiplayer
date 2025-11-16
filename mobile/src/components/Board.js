import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const Board = ({ board, onCellPress, disabled = false }) => {
  const renderCell = (index) => {
    const cellValue = board[index];
    let cellContent = null;
    
    if (cellValue === 'X') {
      cellContent = (
        <View style={styles.xSymbol}>
          <View style={[styles.xLine, styles.xLine1]} />
          <View style={[styles.xLine, styles.xLine2]} />
        </View>
      );
    } else if (cellValue === 'O') {
      cellContent = <View style={styles.circle} />;
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.cell}
        onPress={() => onCellPress(index)}
        disabled={disabled || cellValue !== ''}
        activeOpacity={0.7}
      >
        {cellContent}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderCell(0)}
        <View style={styles.verticalDivider} />
        {renderCell(1)}
        <View style={styles.verticalDivider} />
        {renderCell(2)}
      </View>
      
      <View style={styles.horizontalDivider} />
      
      <View style={styles.row}>
        {renderCell(3)}
        <View style={styles.verticalDivider} />
        {renderCell(4)}
        <View style={styles.verticalDivider} />
        {renderCell(5)}
      </View>
      
      <View style={styles.horizontalDivider} />
      
      <View style={styles.row}>
        {renderCell(6)}
        <View style={styles.verticalDivider} />
        {renderCell(7)}
        <View style={styles.verticalDivider} />
        {renderCell(8)}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const boardSize = Math.min(width - 40, 400);
const cellSize = (boardSize - 4) / 3;

const styles = StyleSheet.create({
  container: {
    width: boardSize,
    height: boardSize,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 2,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  horizontalDivider: {
    width: '100%',
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  xSymbol: {
    width: cellSize * 0.6,
    height: cellSize * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xLine: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  xLine1: {
    transform: [{ rotate: '45deg' }],
  },
  xLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  circle: {
    width: cellSize * 0.5,
    height: cellSize * 0.5,
    borderRadius: (cellSize * 0.5) / 2,
    borderWidth: 4,
    borderColor: '#EF4444',
  },
});

export default Board;
