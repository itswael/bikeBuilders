import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  Divider,
  Switch,
} from 'react-native-paper';
import localBackupService from '../services/localBackup';
import googleDriveSyncService from '../services/googleDriveSync';

export default function GDriveScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastGDriveSync, setLastGDriveSync] = useState(null);

  useEffect(() => {
    checkGoogleSignInStatus();
    loadLastSyncTime();
    loadAutoSyncStatus();
  }, []);

  const checkGoogleSignInStatus = async () => {
    const signedIn = await googleDriveSyncService.isSignedIn();
    setIsSignedIn(signedIn);
    if (signedIn) {
      // Get user info if signed in
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const userInfo = await GoogleSignin.getCurrentUser();
      setUserEmail(userInfo?.user?.email || '');
    }
  };

  const loadLastSyncTime = async () => {
    const lastSync = await googleDriveSyncService.getLastSyncTime();
    if (lastSync) {
      setLastGDriveSync(lastSync.toLocaleString());
    }
  };

  const loadAutoSyncStatus = async () => {
    const enabled = await googleDriveSyncService.isAutoSyncEnabled();
    setAutoSyncEnabled(enabled);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await googleDriveSyncService.signIn();
      
      if (result.success) {
        setIsSignedIn(true);
        setUserEmail(result.userInfo?.user?.email || '');
        Alert.alert('Success', 'Signed in to Google Drive successfully!');
      } else {
        Alert.alert('Error', `Failed to sign in: ${result.error}`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in to Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Google Drive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await googleDriveSyncService.signOut();
              setIsSignedIn(false);
              setUserEmail('');
              setAutoSyncEnabled(false);
              Alert.alert('Success', 'Signed out successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGoogleDriveBackup = async () => {
    try {
      setIsSyncing(true);
      const result = await googleDriveSyncService.uploadBackup();
      
      if (result.success) {
        await loadLastSyncTime();
        Alert.alert('Success', 'Backup uploaded to Google Drive successfully!');
      } else {
        Alert.alert('Error', `Failed to upload backup: ${result.error}`);
      }
    } catch (error) {
      console.error('Google Drive backup error:', error);
      Alert.alert('Error', 'Failed to backup to Google Drive');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleDriveRestore = async () => {
    Alert.alert(
      'Restore from Google Drive',
      'This will replace all current data with the backup from Google Drive. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await googleDriveSyncService.downloadBackup();
              
              if (result.success) {
                Alert.alert('Success', 'Data restored from Google Drive successfully! Please restart the app.');
              } else {
                Alert.alert('Error', `Failed to restore: ${result.error}`);
              }
            } catch (error) {
              console.error('Google Drive restore error:', error);
              Alert.alert('Error', 'Failed to restore from Google Drive');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAutoSyncToggle = async (value) => {
    if (value && !isSignedIn) {
      Alert.alert('Sign In Required', 'Please sign in to Google Drive first to enable auto sync');
      return;
    }
    
    setAutoSyncEnabled(value);
    await googleDriveSyncService.setAutoSyncEnabled(value);
    Alert.alert(
      'Auto Sync ' + (value ? 'Enabled' : 'Disabled'),
      value 
        ? 'Your data will be automatically backed up to Google Drive after changes'
        : 'Automatic backup has been disabled'
    );
  };

  const handleBackup = async () => {
    Alert.alert(
      'Export Backup',
      'This will create a backup file that you can save to your device or share.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              setIsLoading(true);
              await localBackupService.exportBackup();
              setLastBackupDate(new Date().toLocaleString());
              Alert.alert('Success', 'Backup exported successfully! You can now save it to your device or cloud storage.');
            } catch (error) {
              console.error('Backup error:', error);
              Alert.alert('Error', 'Failed to export backup. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRestore = async () => {
    Alert.alert(
      'Import Backup',
      'This will replace all current data with the backup file. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const success = await localBackupService.importBackup();
              
              if (success) {
                Alert.alert('Success', 'Data restored successfully! Please restart the app for changes to take effect.');
              } else {
                Alert.alert('Info', 'Import cancelled');
              }
            } catch (error) {
              console.error('Restore error:', error);
              Alert.alert('Error', 'Failed to restore data. Please ensure the file is a valid BikeBuilders backup.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Google Drive Auto Sync Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Google Drive Auto Sync</Title>
          <Divider style={styles.divider} />

          {!isSignedIn ? (
            <>
              <Paragraph style={styles.description}>
                Sign in to Google Drive to enable automatic backup. Your data will be securely stored in your Google Drive and synced automatically after changes.
              </Paragraph>

              <Button
                mode="contained"
                onPress={handleGoogleSignIn}
                style={styles.button}
                disabled={isLoading}
                icon="google"
              >
                Sign In with Google
              </Button>
            </>
          ) : (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.label}>Signed in as:</Text>
                <Text style={styles.value}>{userEmail}</Text>
              </View>

              {lastGDriveSync && (
                <View style={styles.statusRow}>
                  <Text style={styles.label}>Last Sync:</Text>
                  <Text style={styles.value}>{lastGDriveSync}</Text>
                </View>
              )}

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchTitle}>Auto Sync</Text>
                  <Text style={styles.switchDescription}>
                    Automatically backup after changes
                  </Text>
                </View>
                <Switch
                  value={autoSyncEnabled}
                  onValueChange={handleAutoSyncToggle}
                  disabled={isLoading}
                />
              </View>

              <Divider style={styles.divider} />

              {isSyncing && (
                <View style={styles.syncingContainer}>
                  <ActivityIndicator size="small" color="#6200ee" />
                  <Text style={styles.syncingText}>Syncing to Google Drive...</Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleGoogleDriveBackup}
                style={styles.button}
                disabled={isLoading || isSyncing}
                icon="cloud-upload"
                loading={isSyncing}
              >
                {isSyncing ? 'Backing Up...' : 'Backup Now to Google Drive'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleGoogleDriveRestore}
                style={styles.button}
                disabled={isLoading || isSyncing}
                icon="cloud-download"
              >
                Restore from Google Drive
              </Button>

              <Button
                mode="text"
                onPress={handleGoogleSignOut}
                style={styles.button}
                disabled={isLoading || isSyncing}
                textColor="#d32f2f"
              >
                Sign Out
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Local Backup Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Local Backup</Title>
          <Divider style={styles.divider} />
          
          {lastBackupDate && (
            <View style={styles.statusRow}>
              <Text style={styles.label}>Last Export:</Text>
              <Text style={styles.value}>{lastBackupDate}</Text>
            </View>
          )}

          <Paragraph style={styles.description}>
            Export your data as a backup file that you can save to your device or share via any app.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Export Backup</Title>
          <Divider style={styles.divider} />
          
          <Paragraph style={styles.description}>
            Create a backup file containing all your data including customers, vehicles, services, and settings. You can save it anywhere or share it.
          </Paragraph>

          <Button
            mode="contained"
            onPress={handleBackup}
            style={styles.button}
            disabled={isLoading}
            icon="export"
          >
            Export Backup File
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Import Backup</Title>
          <Divider style={styles.divider} />

          <Paragraph style={[styles.description, styles.warningText]}>
            ⚠️ Warning: Importing will replace all current data with the backup. This action cannot be undone!
          </Paragraph>

          <Button
            mode="outlined"
            onPress={handleRestore}
            style={styles.button}
            disabled={isLoading}
            icon="import"
          >
            Import Backup File
          </Button>
        </Card.Content>
      </Card>
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
  divider: {
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    maxWidth: '60%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 12,
  },
  syncingText: {
    marginLeft: 12,
    color: '#1976d2',
    fontSize: 14,
  },
  description: {
    marginBottom: 16,
    color: '#666',
    lineHeight: 22,
  },
  warningText: {
    color: '#F44336',
    marginTop: 16,
  },
  button: {
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6200ee',
  },
});
