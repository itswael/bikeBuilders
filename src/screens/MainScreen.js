import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  Searchbar,
  FAB,
  Card,
  Text,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import database from '../database/database';

export default function MainScreen({ navigation }) {
  const { userInfo, inProgressServices, refreshInProgressServices } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshInProgressServices();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setIsSearching(true);
      const results = await database.searchVehicles(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleVehiclePress = async (regNumber) => {
    const vehicle = await database.getVehicleByRegNumber(regNumber);
    navigation.navigate('Vehicle', { vehicle });
  };

  const handleNewService = () => {
    navigation.navigate('VehicleRegistration', { mode: 'newService' });
  };

  const renderVehicleTile = ({ item }) => {
    const isInProgress = item.Status === 'In Progress';
    
    return (
      <Card style={styles.card} onPress={() => handleVehiclePress(item.RegNumber)}>
        <Card.Content>
          <Title>{item.RegNumber}</Title>
          <Paragraph>Owner: {item.OwnerName}</Paragraph>
          {isInProgress && item.StartedOn && (
            <Paragraph>Started On: {new Date(item.StartedOn).toLocaleDateString()}</Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const displayData = isSearching ? searchResults : inProgressServices;

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Vehicle Registration Number"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isSearching
              ? 'No vehicles found'
              : 'No services in progress'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderVehicleTile}
          keyExtractor={(item) =>
            isSearching ? item.RegNumber : `${item.ServiceLogID}`
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Service"
        onPress={handleNewService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});
