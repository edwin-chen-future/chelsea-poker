import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SessionCard } from '../components/SessionCard';
import { StatsHeader } from '../components/StatsHeader';
import { EmptyState } from '../components/EmptyState';
import { getSessions } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing } from '../constants';

const PAGE_SIZE = 20;

export function SessionsScreen({ navigation, route }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadFirst = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const data = await getSessions({ limit: PAGE_SIZE, offset: 0 });
      setSessions(data.sessions);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || sessions.length >= total) return;
    setLoadingMore(true);
    try {
      const data = await getSessions({ limit: PAGE_SIZE, offset: sessions.length });
      setSessions(prev => [...prev, ...data.sessions]);
      setTotal(data.total);
    } catch {
      // Silently fail on load more
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, sessions.length, total]);

  useEffect(() => {
    if (user) loadFirst();
  }, [user]);

  // Reload when navigated back after add/edit
  const refresh = route.params?.refresh;
  useEffect(() => {
    if (refresh) {
      loadFirst(true);
    }
  }, [refresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFirst(true);
  }, [loadFirst]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Please sign in from the Profile tab to view sessions.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={sessions}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<StatsHeader sessions={sessions} />}
      ListEmptyComponent={<EmptyState />}
      renderItem={({ item }) => (
        <SessionCard
          session={item}
          onPress={() => navigation.navigate('Edit Session', { session: item })}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing.md }} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.loss,
    fontSize: 15,
    textAlign: 'center',
  },
});
