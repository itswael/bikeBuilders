import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import database from '../database/database';
import { useApp } from '../context/AppContext';

export default function VehicleRegistrationScreen({ navigation, route }) {
  const { mode, vehicle } = route.params || {};
  const { triggerAutoSync } = useApp();
  const [regNumber, setRegNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [nextServiceDays, setNextServiceDays] = useState('90');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setRegNumber(vehicle.RegNumber);
      setOwnerName(vehicle.OwnerName || vehicle.Name);
      setPhone(vehicle.Phone || '');
      setAddress(vehicle.Address || '');
      setEmail(vehicle.Email || '');
      setVehicleName(vehicle.VehicleName || '');
      setNextServiceDays(String(vehicle.NextServiceDays || 90));
    }
  }, [vehicle]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!regNumber.trim()) {
      newErrors.regNumber = 'Registration number is required';
    }
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (vehicle) {
        // Update existing vehicle and customer
        await database.updateCustomer(
          vehicle.CustomerID,
          ownerName,
          phone,
          address,
          email
        );
        await database.updateVehicle(
          regNumber,
          vehicle.CustomerID,
          vehicleName,
          vehicle.LastServiceDate,
          vehicle.LastReading,
          parseInt(nextServiceDays) || 90
        );
        navigation.goBack();
      } else {
        // Check if vehicle already exists
        const existingVehicle = await database.getVehicleByRegNumber(regNumber);
        
        if (existingVehicle) {
          // Vehicle exists, navigate to new service
          navigation.replace('NewService', { vehicle: existingVehicle });
        } else {
          // Create new customer and vehicle
          const customerId = await database.addCustomer(ownerName, phone, address, email);
          await database.addVehicle(regNumber, customerId, vehicleName, parseInt(nextServiceDays) || 90);
          
          // Trigger auto-sync after adding vehicle
          triggerAutoSync();
          
          const newVehicle = await database.getVehicleByRegNumber(regNumber);
          
          if (mode === 'newService') {
            navigation.replace('NewService', { vehicle: newVehicle });
          } else {
            navigation.goBack();
          }
        }
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error saving vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!regNumber.trim()) {
      alert('Please enter a registration number');
      return;
    }

    setIsLoading(true);
    try {
      const existingVehicle = await database.getVehicleByRegNumber(regNumber);
      
      if (existingVehicle) {
        navigation.replace('NewService', { vehicle: existingVehicle });
      } else {
        alert('Vehicle not found. Please fill in the details to register.');
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      alert('Error searching vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>
          {vehicle ? 'Edit Vehicle' : 'Vehicle Registration'}
        </Text>

        <TextInput
          label="Vehicle Registration Number*"
          value={regNumber}
          onChangeText={setRegNumber}
          mode="outlined"
          style={styles.input}
          error={!!errors.regNumber}
          disabled={!!vehicle}
        />
        {errors.regNumber && (
          <Text style={styles.errorText}>{errors.regNumber}</Text>
        )}

        {!vehicle && mode === 'newService' && (
          <Button
            mode="contained"
            onPress={handleSearch}
            style={styles.searchButton}
            loading={isLoading}
          >
            Search Vehicle
          </Button>
        )}

        <TextInput
          label="Vehicle Name"
          value={vehicleName}
          onChangeText={setVehicleName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Owner Name*"
          value={ownerName}
          onChangeText={setOwnerName}
          mode="outlined"
          style={styles.input}
          error={!!errors.ownerName}
        />
        {errors.ownerName && (
          <Text style={styles.errorText}>{errors.ownerName}</Text>
        )}

        <TextInput
          label="Phone Number*"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          error={!!errors.phone}
        />
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone}</Text>
        )}

        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="Next Service Days"
          value={nextServiceDays}
          onChangeText={setNextServiceDays}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
          placeholder="90"
          helperText="Days after service to send reminder (default: 90)"
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={isLoading}
        >
          {vehicle ? 'Update' : 'Register & Continue'}
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
  form: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    marginBottom: 32,
  },
  searchButton: {
    marginBottom: 24,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
});
