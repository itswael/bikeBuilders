import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  Button,
  IconButton,
} from 'react-native-paper';

export default function AboutScreen({ navigation }) {
  const handleEmailPress = () => {
    Linking.openURL('mailto:developer@bikebuilders.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://github.com/yourusername/bikebuilders');
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
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.appTitle}>BikeBuilders</Title>
            <Paragraph style={styles.version}>Version 1.0.0</Paragraph>
            
            <Text style={styles.description}>
              A comprehensive garage and vehicle service management system designed 
              to help you efficiently manage your customers, vehicles, and service records.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Features</Title>
            <View style={styles.featureList}>
              <Text style={styles.feature}>• Customer & Vehicle Management</Text>
              <Text style={styles.feature}>• Service Tracking</Text>
              <Text style={styles.feature}>• Payment Management</Text>
              <Text style={styles.feature}>• Service History</Text>
              <Text style={styles.feature}>• Admin Panel for Service Inventory</Text>
              <Text style={styles.feature}>• Google Drive Backup (Coming Soon)</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Developer Information</Title>
            <Paragraph style={styles.devInfo}>
              Developed with ❤️ for garage management
            </Paragraph>
            
            <Button
              mode="outlined"
              onPress={handleEmailPress}
              style={styles.contactButton}
              icon="email"
            >
              Contact Developer
            </Button>

            <Button
              mode="outlined"
              onPress={handleWebsitePress}
              style={styles.contactButton}
              icon="web"
            >
              Visit GitHub
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>License</Title>
            <Paragraph>
              © 2025 BikeBuilders. All rights reserved.
            </Paragraph>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  featureList: {
    marginTop: 12,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  devInfo: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  contactButton: {
    marginTop: 8,
  },
});
