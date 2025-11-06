import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Google Drive API configuration
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'bikeBuilders_backup.json';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
  }

  // Initialize Google OAuth
  async authenticate() {
    try {
      // TODO: Replace with your Google OAuth client ID
      const clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'bikebuilders',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${GOOGLE_DRIVE_SCOPE}`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success') {
        this.accessToken = result.params.access_token;
        await AsyncStorage.setItem('googleDriveToken', this.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error authenticating with Google:', error);
      return false;
    }
  }

  // Load saved token
  async loadToken() {
    try {
      const token = await AsyncStorage.getItem('googleDriveToken');
      if (token) {
        this.accessToken = token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading token:', error);
      return false;
    }
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Upload backup to Google Drive
  async uploadBackup(jsonData) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // First, check if file exists
      const fileId = await this.findBackupFile();

      const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
      };

      const blob = new Blob([jsonData], { type: 'application/json' });
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', blob);

      let url;
      if (fileId) {
        // Update existing file
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      } else {
        // Create new file
        url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      }

      const response = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload backup');
      }

      return true;
    } catch (error) {
      console.error('Error uploading backup:', error);
      throw error;
    }
  }

  // Download backup from Google Drive
  async downloadBackup() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const fileId = await this.findBackupFile();

      if (!fileId) {
        return null; // No backup found
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const jsonData = await response.text();
      return jsonData;
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  }

  // Find backup file in Google Drive
  async findBackupFile() {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}'&spaces=drive`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search for backup file');
      }

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error finding backup file:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    this.accessToken = null;
    await AsyncStorage.removeItem('googleDriveToken');
  }
}

export default new GoogleDriveService();
