import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  IconButton,
  FAB,
} from 'react-native-paper';
import database from '../database/database';

export default function VehicleScreen({ navigation, route }) {
  const { vehicle: initialVehicle } = route.params;
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVehicleData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVehicleData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadVehicleData = async () => {
    try {
      const updatedVehicle = await database.getVehicleByRegNumber(vehicle.RegNumber);
      const vehicleServices = await database.getServicesByRegNumber(vehicle.RegNumber);
      setVehicle(updatedVehicle);
      setServices(vehicleServices);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServicePress = (service) => {
    navigation.navigate('VehicleService', {
      service,
      vehicle,
      readOnly: service.Status === 'Completed',
    });
  };

  const handleEdit = () => {
    navigation.navigate('VehicleRegistration', { vehicle });
  };

  const renderServiceTile = ({ item }) => {
    const isInProgress = item.Status === 'In Progress';
    const date = isInProgress
      ? item.StartedOn
        ? new Date(item.StartedOn).toLocaleDateString()
        : 'N/A'
      : item.CompletedOn
      ? new Date(item.CompletedOn).toLocaleDateString()
      : 'N/A';

    return (
      <Card style={styles.card} onPress={() => handleServicePress(item)}>
        <Card.Content>
          <View style={styles.serviceHeader}>
            <View>
              <Title style={styles.serviceTitle}>
                {isInProgress ? 'In Progress' : 'Completed'}
              </Title>
              <Paragraph>
                {isInProgress ? 'Started' : 'Completed'}: {date}
              </Paragraph>
              <Paragraph>Amount: ₹{item.TotalAmount}</Paragraph>
              {item.OutstandingBalance > 0 && (
                <Paragraph style={styles.balance}>
                  Balance: ₹{item.OutstandingBalance}
                </Paragraph>
              )}
            </View>
            {isInProgress && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleServicePress(item)}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Title style={styles.regNumber}>{vehicle.RegNumber}</Title>
                {vehicle.VehicleName && (
                  <Paragraph>{vehicle.VehicleName}</Paragraph>
                )}
              </View>
              <IconButton
                icon="pencil"
                size={24}
                onPress={handleEdit}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Owner:</Text>
              <Text style={styles.value}>{vehicle.OwnerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{vehicle.Phone}</Text>
            </View>

            {vehicle.Address && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{vehicle.Address}</Text>
              </View>
            )}

            {vehicle.Email && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{vehicle.Email}</Text>
              </View>
            )}

            {vehicle.LastServiceDate && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Service:</Text>
                <Text style={styles.value}>
                  {new Date(vehicle.LastServiceDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {vehicle.LastReading && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Reading:</Text>
                <Text style={styles.value}>{vehicle.LastReading}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>Service History</Text>
          {services.length === 0 ? (
            <Text style={styles.emptyText}>No services found</Text>
          ) : (
            <FlatList
              data={services}
              renderItem={renderServiceTile}
              keyExtractor={(item) => item.ServiceLogID.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Service"
        onPress={() => navigation.navigate('NewService', { vehicle })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  detailsCard: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  regNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    flex: 1,
  },
  servicesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
  },
  balance: {
    color: '#B00020',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});
