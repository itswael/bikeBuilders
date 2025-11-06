import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import database from '../database/database';

export default function NewServiceScreen({ navigation, route }) {
  const { vehicle } = route.params;
  const { commonServices, refreshInProgressServices, triggerAutoSync } = useApp();
  const [currentReading, setCurrentReading] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    calculateTotal();
  }, [selectedServices]);

  const calculateTotal = () => {
    const total = selectedServices.reduce((sum, service) => sum + parseFloat(service.amount || 0), 0);
    setTotalAmount(total);
  };

  const handleServiceSelect = (service) => {
    const exists = selectedServices.find(s => s.name === service.ServiceName);
    
    if (!exists) {
      setSelectedServices([
        ...selectedServices,
        {
          name: service.ServiceName,
          amount: service.DefaultAmount.toString(),
        },
      ]);
    }
  };

  const handleServiceRemove = (serviceName) => {
    setSelectedServices(selectedServices.filter(s => s.name !== serviceName));
  };

  const handleAmountChange = (serviceName, newAmount) => {
    setSelectedServices(
      selectedServices.map(s =>
        s.name === serviceName ? { ...s, amount: newAmount } : s
      )
    );
  };

  const handleSubmit = async () => {
    if (!currentReading.trim()) {
      alert('Please enter current meter reading');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setIsLoading(true);
    try {
      const startedOn = new Date().toISOString();
      const serviceId = await database.addService(
        vehicle.RegNumber,
        parseInt(currentReading),
        totalAmount,
        startedOn
      );

      // Add service parts
      for (const service of selectedServices) {
        await database.addServicePart(
          serviceId,
          service.name,
          parseFloat(service.amount)
        );
      }

      // Trigger auto-sync after creating service
      triggerAutoSync();

      await refreshInProgressServices();
      navigation.navigate('Main');
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error creating service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCommonService = ({ item }) => (
    <Chip
      style={styles.chip}
      onPress={() => handleServiceSelect(item)}
      mode="outlined"
    >
      {item.ServiceName} - ₹{item.DefaultAmount}
    </Chip>
  );

  const renderSelectedService = (service, index) => (
    <View key={index} style={styles.selectedServiceRow}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <View style={styles.serviceActions}>
        <TextInput
          value={service.amount}
          onChangeText={(text) => handleAmountChange(service.name, text)}
          mode="outlined"
          keyboardType="numeric"
          style={styles.amountInput}
          dense
        />
        <IconButton
          icon="delete"
          size={20}
          onPress={() => handleServiceRemove(service.name)}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.vehicleCard}>
          <Card.Content>
            <Text style={styles.vehicleTitle}>Vehicle: {vehicle.RegNumber}</Text>
            <Text>Owner: {vehicle.OwnerName}</Text>
            {vehicle.LastReading && (
              <Text>Last Reading: {vehicle.LastReading}</Text>
            )}
          </Card.Content>
        </Card>

        <TextInput
          label="Current Meter Reading*"
          value={currentReading}
          onChangeText={setCurrentReading}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Select Services</Text>
        
        <FlatList
          data={commonServices}
          renderItem={renderCommonService}
          keyExtractor={(item) => item.ServiceID.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        />

        {selectedServices.length > 0 && (
          <View style={styles.selectedServicesContainer}>
            <Text style={styles.sectionTitle}>Selected Services</Text>
            {selectedServices.map((service, index) =>
              renderSelectedService(service, index)
            )}
          </View>
        )}

        <Card style={styles.totalCard}>
          <Card.Content>
            <Text style={styles.totalLabel}>Total Quote</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={isLoading}
        >
          Create Service
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  vehicleCard: {
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  chipContainer: {
    paddingBottom: 16,
  },
  chip: {
    marginRight: 8,
  },
  selectedServicesContainer: {
    marginTop: 16,
  },
  selectedServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    width: 100,
    marginRight: 8,
  },
  totalCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#6200ee',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  button: {
    marginBottom: 32,
  },
});
