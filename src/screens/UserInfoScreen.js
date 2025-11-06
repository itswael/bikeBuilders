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
  IconButton,
} from 'react-native-paper';
import { useApp } from '../context/AppContext';
import database from '../database/database';

export default function UserInfoScreen({ navigation }) {
  const { userInfo, loadUserInfo } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [garageName, setGarageName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.Name || '');
      setEmail(userInfo.Email || '');
      setPhoneNumber(userInfo.PhoneNumber || '');
      setGarageName(userInfo.GarageName || '');
      setAddress(userInfo.Address || '');
    }
  }, [userInfo]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await database.updateUserInfo(name, email, phoneNumber, garageName, address);
      await loadUserInfo();
      alert('User information updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating user info:', error);
      alert('Error updating user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>User Information</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Application User Info</Text>

        <TextInput
          label="Garage Name"
          value={garageName}
          onChangeText={setGarageName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
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
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={isLoading}
        >
          Save
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 32,
  },
});
