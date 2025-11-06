import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  Divider,
  List,
  Chip,
} from 'react-native-paper';
import * as SMS from 'expo-sms';
import database from '../database/database';

export default function SMSReminderScreen() {
  const [vehiclesNeedingReminder, setVehiclesNeedingReminder] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    checkSMSAvailability();
    loadVehiclesNeedingReminder();
  }, []);

  // Check if SMS is available on this device
  const checkSMSAvailability = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    setSmsAvailable(isAvailable);
    if (!isAvailable) {
      Alert.alert('SMS Not Available', 'SMS functionality is not available on this device.');
    }
  };

  // Load vehicles that need service reminders
  const loadVehiclesNeedingReminder = async () => {
    try {
      setIsLoading(true);
      const vehicles = await database.getVehiclesNeedingReminder();
      setVehiclesNeedingReminder(vehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles needing reminders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate days since last service
  const getDaysSinceService = (lastServiceDate) => {
    if (!lastServiceDate) return 0;
    const lastService = new Date(lastServiceDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastService);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Create message template for service reminder
  const createMessage = async (vehicle) => {
    const userInfo = await database.getUserInfo();
    const garageName = userInfo?.GarageName || 'BikeBuilders';
    const daysSince = getDaysSinceService(vehicle.LastServiceDate);
    
    return `Hi ${vehicle.OwnerName}, this is ${garageName}. Your vehicle ${vehicle.RegNumber} is due for service (last serviced ${daysSince} days ago). Please contact us to schedule an appointment. Thank you!`;
  };

  // Send SMS to a single vehicle owner with delay
  const sendSingleSMS = async (vehicle, index, total) => {
    try {
      console.log(`[SMS ${index + 1}/${total}] Preparing message for ${vehicle.RegNumber} - ${vehicle.Phone}`);
      
      const message = await createMessage(vehicle);
      
      // For Android, we use the SMS intent which requires user confirmation
      // This is the safest approach for React Native/Expo
      const { result } = await SMS.sendSMSAsync([vehicle.Phone], message);
      
      if (result === 'sent') {
        console.log(`[SMS ${index + 1}/${total}] SUCCESS: Message sent to ${vehicle.Phone}`);
        return { success: true, vehicle };
      } else {
        console.log(`[SMS ${index + 1}/${total}] CANCELLED: User cancelled message to ${vehicle.Phone}`);
        return { success: false, vehicle, reason: 'cancelled' };
      }
    } catch (error) {
      console.error(`[SMS ${index + 1}/${total}] FAILED: Error sending to ${vehicle.Phone}`, error);
      return { success: false, vehicle, error: error.message };
    }
  };

  // Send reminders to all vehicles needing service with delay between each
  const handleSendReminders = async () => {
    if (!smsAvailable) {
      Alert.alert('Error', 'SMS is not available on this device.');
      return;
    }

    if (vehiclesNeedingReminder.length === 0) {
      Alert.alert('No Reminders', 'No vehicles need service reminders at this time.');
      return;
    }

    Alert.alert(
      'Send Service Reminders',
      `Send SMS reminders to ${vehiclesNeedingReminder.length} customer(s)? Each message will require your confirmation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setIsSending(true);
            setSentCount(0);
            setFailedCount(0);

            const results = [];
            const total = vehiclesNeedingReminder.length;

            console.log(`[SMS BULK] Starting bulk SMS send to ${total} customers`);
            console.log('[SMS BULK] Note: Each message requires user confirmation on device');

            // Send messages one by one
            for (let i = 0; i < vehiclesNeedingReminder.length; i++) {
              const vehicle = vehiclesNeedingReminder[i];
              
              // Send SMS
              const result = await sendSingleSMS(vehicle, i, total);
              results.push(result);

              // Update counters
              if (result.success) {
                setSentCount(prev => prev + 1);
              } else {
                setFailedCount(prev => prev + 1);
              }

              // Add delay between messages (5 seconds) to avoid throttling
              // Only add delay if not the last message
              if (i < vehiclesNeedingReminder.length - 1) {
                console.log(`[SMS BULK] Waiting 5 seconds before next message...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
            }

            setIsSending(false);

            // Show summary
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.filter(r => !r.success).length;

            console.log(`[SMS BULK] Completed: ${successCount} sent, ${failedCount} failed/cancelled`);

            Alert.alert(
              'SMS Summary',
              `Successfully sent: ${successCount}\nFailed/Cancelled: ${failedCount}`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Reload the list
                    loadVehiclesNeedingReminder();
                    setSentCount(0);
                    setFailedCount(0);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Send reminder to a single customer
  const handleSendSingle = async (vehicle) => {
    if (!smsAvailable) {
      Alert.alert('Error', 'SMS is not available on this device.');
      return;
    }

    try {
      const message = await createMessage(vehicle);
      const { result } = await SMS.sendSMSAsync([vehicle.Phone], message);
      
      if (result === 'sent') {
        Alert.alert('Success', `Reminder sent to ${vehicle.OwnerName}`);
        console.log(`[SMS SINGLE] SUCCESS: Sent reminder to ${vehicle.Phone}`);
      } else {
        console.log(`[SMS SINGLE] CANCELLED: User cancelled message to ${vehicle.Phone}`);
      }
    } catch (error) {
      console.error('[SMS SINGLE] FAILED:', error);
      Alert.alert('Error', 'Failed to send SMS. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Service Reminders</Title>
            <Divider style={styles.divider} />
            
            {!smsAvailable && (
              <Paragraph style={styles.errorText}>
                ⚠️ SMS functionality is not available on this device.
              </Paragraph>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Vehicles Due</Text>
                <Text style={styles.statValue}>{vehiclesNeedingReminder.length}</Text>
              </View>
              {isSending && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sent</Text>
                    <Text style={[styles.statValue, styles.successText]}>{sentCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Failed</Text>
                    <Text style={[styles.statValue, styles.errorText]}>{failedCount}</Text>
                  </View>
                </>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleSendReminders}
              style={styles.button}
              disabled={!smsAvailable || isLoading || isSending || vehiclesNeedingReminder.length === 0}
              loading={isSending}
              icon="send"
            >
              {isSending ? 'Sending Reminders...' : 'Send All Reminders'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Vehicles Due for Service</Title>
            <Divider style={styles.divider} />

            {isLoading ? (
              <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
            ) : vehiclesNeedingReminder.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                No vehicles are currently due for service reminders.
              </Paragraph>
            ) : (
              vehiclesNeedingReminder.map((vehicle, index) => (
                <Card key={index} style={styles.vehicleCard}>
                  <Card.Content>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.regNumber}>{vehicle.RegNumber}</Text>
                        {vehicle.VehicleName && (
                          <Text style={styles.vehicleName}>{vehicle.VehicleName}</Text>
                        )}
                      </View>
                      <Chip 
                        mode="outlined"
                        style={styles.daysChip}
                        textStyle={styles.daysChipText}
                      >
                        {getDaysSinceService(vehicle.LastServiceDate)} days
                      </Chip>
                    </View>

                    <View style={styles.vehicleDetails}>
                      <Text style={styles.detailLabel}>Owner:</Text>
                      <Text style={styles.detailValue}>{vehicle.OwnerName}</Text>
                    </View>

                    <View style={styles.vehicleDetails}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValue}>{vehicle.Phone}</Text>
                    </View>

                    {vehicle.LastServiceDate && (
                      <View style={styles.vehicleDetails}>
                        <Text style={styles.detailLabel}>Last Service:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(vehicle.LastServiceDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    <Button
                      mode="outlined"
                      onPress={() => handleSendSingle(vehicle)}
                      style={styles.singleButton}
                      disabled={!smsAvailable || isSending}
                      icon="send"
                      compact
                    >
                      Send Reminder
                    </Button>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  button: {
    marginTop: 8,
  },
  loader: {
    marginVertical: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 24,
  },
  vehicleCard: {
    marginTop: 12,
    backgroundColor: '#fff',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  regNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  vehicleName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  daysChip: {
    backgroundColor: '#FFE0B2',
  },
  daysChipText: {
    color: '#E65100',
    fontWeight: 'bold',
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    color: '#000',
  },
  singleButton: {
    marginTop: 8,
  },
});
