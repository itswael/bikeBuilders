import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  Button,
  TextInput,
  Portal,
  Dialog,
  ToggleButton,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import database from '../database/database';

export default function VehicleServiceScreen({ navigation, route }) {
  const { service: initialService, vehicle, readOnly } = route.params;
  const { refreshInProgressServices } = useApp();
  const [service, setService] = useState(initialService);
  const [serviceParts, setServiceParts] = useState([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(service.PaymentStatus);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadServiceParts();
  }, []);

  const loadServiceParts = async () => {
    try {
      const parts = await database.getServiceParts(service.ServiceLogID);
      setServiceParts(parts);
    } catch (error) {
      console.error('Error loading service parts:', error);
    }
  };

  const handlePayment = () => {
    setShowPaymentDialog(true);
    setPaidAmount(service.PaidAmount?.toString() || '');
  };

  const handlePaymentSubmit = async () => {
    const paid = parseFloat(paidAmount) || 0;
    const balance = service.TotalAmount - paid;
    const newPaymentStatus = balance > 0 ? 'Partial' : 'Paid';

    try {
      setIsLoading(true);
      await database.updateService(
        service.ServiceLogID,
        paid,
        service.Status,
        service.CompletedOn,
        balance,
        newPaymentStatus
      );

      setService({
        ...service,
        PaidAmount: paid,
        OutstandingBalance: balance,
        PaymentStatus: newPaymentStatus,
      });
      setPaymentStatus(newPaymentStatus);
      setShowPaymentDialog(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      const completedOn = new Date().toISOString();
      const balance = service.TotalAmount - (service.PaidAmount || 0);

      await database.updateService(
        service.ServiceLogID,
        service.PaidAmount || 0,
        'Completed',
        completedOn,
        balance,
        service.PaymentStatus
      );

      // Update vehicle's last service date and reading
      await database.updateVehicle(
        vehicle.RegNumber,
        vehicle.CustomerID,
        vehicle.VehicleName,
        completedOn,
        service.CurrentReading
      );

      await refreshInProgressServices();
      navigation.goBack();
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Error completing service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Vehicle: {vehicle.RegNumber}</Title>
          <Paragraph>Owner: {vehicle.OwnerName}</Paragraph>
          <Paragraph>
            Current Reading: {service.CurrentReading}
          </Paragraph>
          <Paragraph>
            Started: {service.StartedOn ? new Date(service.StartedOn).toLocaleDateString() : 'N/A'}
          </Paragraph>
          {service.CompletedOn && (
            <Paragraph>
              Completed: {new Date(service.CompletedOn).toLocaleDateString()}
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Service Details</Title>
          {serviceParts.map((part, index) => (
            <View key={index} style={styles.partRow}>
              <Text style={styles.partName}>{part.PartName}</Text>
              <Text style={styles.partAmount}>₹{part.Amount}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.totalRow}>
            <Title>Total Amount</Title>
            <Title>₹{service.TotalAmount}</Title>
          </View>

          <View style={styles.totalRow}>
            <Text>Paid Amount</Text>
            <Text>₹{service.PaidAmount || 0}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{service.OutstandingBalance || service.TotalAmount}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text>Payment Status: </Text>
            <Text
              style={[
                styles.statusText,
                paymentStatus === 'Paid' && styles.paidStatus,
                paymentStatus === 'Partial' && styles.partialStatus,
              ]}
            >
              {paymentStatus}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text>Service Status: </Text>
            <Text
              style={[
                styles.statusText,
                service.Status === 'Completed' && styles.completedStatus,
              ]}
            >
              {service.Status}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {!readOnly && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handlePayment}
            style={styles.button}
            disabled={isLoading}
          >
            Update Payment
          </Button>

          <Button
            mode="contained"
            onPress={handleComplete}
            style={styles.button}
            disabled={isLoading}
            loading={isLoading}
          >
            Complete Service
          </Button>
        </View>
      )}

      <Portal>
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>Update Payment</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Total Amount: ₹{service.TotalAmount}
            </Text>
            <TextInput
              label="Paid Amount"
              value={paidAmount}
              onChangeText={setPaidAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onPress={handlePaymentSubmit} loading={isLoading}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  partName: {
    flex: 1,
  },
  partAmount: {
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontWeight: 'bold',
    color: '#B00020',
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#B00020',
    fontSize: 18,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statusText: {
    fontWeight: 'bold',
  },
  paidStatus: {
    color: '#4CAF50',
  },
  partialStatus: {
    color: '#FF9800',
  },
  completedStatus: {
    color: '#4CAF50',
  },
  actions: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
  dialogText: {
    marginBottom: 16,
    fontSize: 16,
  },
  input: {
    marginBottom: 8,
  },
});
