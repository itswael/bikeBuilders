import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import database from '../database/database';

class LocalBackupService {
  // Export database to JSON file and share it
  async exportBackup() {
    try {
      console.log('Starting backup export...');
      
      // Get data from database
      const jsonData = await database.exportToJSON();
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `bikebuilders_backup_${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      console.log('Backup file created:', fileUri);
      
      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save BikeBuilders Backup',
          UTI: 'public.json',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
      
      return true;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  // Import database from JSON file
  async importBackup() {
    try {
      console.log('Starting backup import...');
      
      // Pick a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'cancel') {
        return false;
      }

      console.log('File selected:', result.uri);
      
      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(result.uri);
      
      // Import to database
      await database.importFromJSON(fileContent);
      
      console.log('Backup imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      throw error;
    }
  }
}

export default new LocalBackupService();
