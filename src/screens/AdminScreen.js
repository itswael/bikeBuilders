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
  TextInput,
  Button,
  IconButton,
  Portal,
  Dialog,
  FAB,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import database from '../database/database';

export default function AdminScreen({ navigation }) {
  const { commonServices, refreshCommonServices } = useApp();
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = () => {
    setEditingService(null);
    setServiceName('');
    setDefaultAmount('');
    setShowDialog(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setServiceName(service.ServiceName);
    setDefaultAmount(service.DefaultAmount.toString());
    setShowDialog(true);
  };

  const handleDelete = async (serviceId) => {
    try {
      await database.deleteCommonService(serviceId);
      await refreshCommonServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!serviceName.trim()) {
      alert('Please enter service name');
      return;
    }

    if (!defaultAmount.trim()) {
      alert('Please enter default amount');
      return;
    }

    setIsLoading(true);
    try {
      if (editingService) {
        await database.updateCommonService(
          editingService.ServiceID,
          serviceName,
          parseFloat(defaultAmount)
        );
      } else {
        await database.addCommonService(serviceName, parseFloat(defaultAmount));
      }

      await refreshCommonServices();
      setShowDialog(false);
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderService = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Title style={styles.serviceName}>{item.ServiceName}</Title>
            <Text style={styles.serviceAmount}>₹{item.DefaultAmount}</Text>
          </View>
          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEdit(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDelete(item.ServiceID)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Common Services & Charges</Text>

        {commonServices.length === 0 ? (
          <Text style={styles.emptyText}>
            No services added yet. Tap the + button to add.
          </Text>
        ) : (
          <FlatList
            data={commonServices}
            renderItem={renderService}
            keyExtractor={(item) => item.ServiceID.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAdd}
      />

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>
            {editingService ? 'Edit Service' : 'Add Service'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Service Name*"
              value={serviceName}
              onChangeText={setServiceName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Default Amount*"
              value={defaultAmount}
              onChangeText={setDefaultAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleSubmit} loading={isLoading}>
              {editingService ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    marginBottom: 4,
  },
  serviceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  actions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  input: {
    marginBottom: 12,
  },
});
