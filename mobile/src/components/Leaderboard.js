import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getLeaderboard } from '../services/api';

const Leaderboard = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosition, setUserPosition] = useState(-1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data.leaderboard || []);
        
        // Find current user's position
        if (currentUserId) {
          const position = data.leaderboard.findIndex(
            (player) => player.user_id === currentUserId
          );
          setUserPosition(position);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUserId]);

  const renderItem = ({ item, index }) => {
    const isCurrentUser = item.user_id === currentUserId;
    
    return (
      <View style={[
        styles.row,
        isCurrentUser && styles.currentUserRow,
        index === 0 && styles.firstPlace,
        index === 1 && styles.secondPlace,
        index === 2 && styles.thirdPlace,
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rank,
            isCurrentUser && styles.currentUserText,
            (index === 0 || index === 1 || index === 2) && styles.topThreeRank
          ]}>
            {index + 1}
          </Text>
        </View>
        
        <View style={styles.playerInfo}>
          <Text 
            style={[
              styles.playerName,
              isCurrentUser && styles.currentUserText
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.display_name || 'Anonymous'}
          </Text>
          <Text style={styles.rating}>
            {Math.round(item.rating || 1500)}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.winRate}>
            {item.wins || 0}W • {item.losses || 0}L • {item.draws || 0}D
          </Text>
          <Text style={styles.winRate}>
            {item.wins + item.losses > 0 
              ? Math.round((item.wins / (item.wins + item.losses)) * 100) 
              : 0}% Win Rate
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {leaderboard.length > 0 ? (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.user_id}-${index}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerText}>Rank</Text>
              <Text style={[styles.headerText, { flex: 2 }]}>Player</Text>
              <Text style={[styles.headerText, { textAlign: 'right' }]}>Stats</Text>
            </View>
          }
          ListFooterComponent={
            userPosition >= 3 && (
              <View style={styles.yourPositionContainer}>
                <Text style={styles.yourPositionText}>Your Position: {userPosition + 1}</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leaderboard data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currentUserRow: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  firstPlace: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  secondPlace: {
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  thirdPlace: {
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  topThreeRank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 2,
    marginLeft: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  rating: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsContainer: {
    flex: 3,
    alignItems: 'flex-end',
  },
  winRate: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  currentUserText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  yourPositionContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  yourPositionText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default Leaderboard;
