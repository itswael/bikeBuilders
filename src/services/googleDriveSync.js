import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import database from '../database/database';

/**
 * Google Drive Automatic Sync Service
 * Provides seamless background backup to Google Drive
 * 
 * Setup Required:
 * 1. Create project in Google Cloud Console
 * 2. Enable Google Drive API
 * 3. Create OAuth 2.0 credentials (Android)
 * 4. Add your Web Client ID below
 */

const GOOGLE_DRIVE_FOLDER_NAME = 'BikeBuilders';
const BACKUP_FILE_NAME = 'bikebuilders_backup.json';
const LAST_SYNC_KEY = 'last_google_drive_sync';
const AUTO_SYNC_ENABLED_KEY = 'auto_sync_enabled';

class GoogleDriveSyncService {
  constructor() {
    this.isConfigured = false;
    this.accessToken = null;
    this.folderId = null;
  }

  /**
   * Configure Google Sign-In
   * Replace WEB_CLIENT_ID with your actual Web Client ID from Google Cloud Console
   */
  configure() {
    try {
      GoogleSignin.configure({
        // TODO: Replace with your Web Client ID from Google Cloud Console
        webClientId: '927870388857-due218kv16e1lo9vdvmtejpbo6keqdi1.apps.googleusercontent.com',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        offlineAccess: true,
      });
      this.isConfigured = true;
      console.log('[GoogleDriveSync] Configured successfully');
    } catch (error) {
      console.error('[GoogleDriveSync] Configuration error:', error);
    }
  }

  /**
   * Sign in to Google and get access token
   */
  async signIn() {
    try {
      if (!this.isConfigured) {
        this.configure();
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      this.accessToken = tokens.accessToken;
      console.log('[GoogleDriveSync] Sign in successful');
      
      return { success: true, userInfo };
    } catch (error) {
      console.error('[GoogleDriveSync] Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      await GoogleSignin.signOut();
      this.accessToken = null;
      this.folderId = null;
      console.log('[GoogleDriveSync] Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('[GoogleDriveSync] Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is signed in
   */
  async isSignedIn() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const tokens = await GoogleSignin.getTokens();
        this.accessToken = tokens.accessToken;
      }
      return isSignedIn;
    } catch (error) {
      console.error('[GoogleDriveSync] Check sign in error:', error);
      return false;
    }
  }

  /**
   * Get or create BikeBuilders folder in Google Drive
   */
  async getOrCreateFolder() {
    try {
      if (this.folderId) {
        return this.folderId;
      }

      // Search for existing folder
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${GOOGLE_DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        this.folderId = searchData.files[0].id;
        console.log('[GoogleDriveSync] Found existing folder:', this.folderId);
        return this.folderId;
      }

      // Create new folder
      const createUrl = 'https://www.googleapis.com/drive/v3/files';
      const folderMetadata = {
        name: GOOGLE_DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
      });

      const createData = await createResponse.json();
      this.folderId = createData.id;
      console.log('[GoogleDriveSync] Created new folder:', this.folderId);
      
      return this.folderId;
    } catch (error) {
      console.error('[GoogleDriveSync] Folder error:', error);
      throw error;
    }
  }

  /**
   * Upload backup to Google Drive
   */
  async uploadBackup() {
    try {
      console.log('[GoogleDriveSync] Starting backup upload...');

      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        throw new Error('Not signed in to Google');
      }

      // Get folder ID
      const folderId = await this.getOrCreateFolder();

      // Export database to JSON
      const jsonData = await database.exportToJSON();

      // Check if backup file already exists
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const searchData = await searchResponse.json();
      const fileExists = searchData.files && searchData.files.length > 0;
      const fileId = fileExists ? searchData.files[0].id : null;

      // Create multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      // Don't include parents when updating (fileExists = true)
      const metadata = fileExists 
        ? {
            name: BACKUP_FILE_NAME,
            mimeType: 'application/json',
          }
        : {
            name: BACKUP_FILE_NAME,
            mimeType: 'application/json',
            parents: [folderId],
          };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        jsonData +
        closeDelimiter;

      const url = fileExists
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

      const method = fileExists ? 'PATCH' : 'POST';

      const uploadResponse = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      
      // Save last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      console.log('[GoogleDriveSync] Backup uploaded successfully:', uploadData.id);
      return { success: true, fileId: uploadData.id };
    } catch (error) {
      console.error('[GoogleDriveSync] Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download backup from Google Drive
   */
  async downloadBackup() {
    try {
      console.log('[GoogleDriveSync] Starting backup download...');

      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        throw new Error('Not signed in to Google');
      }

      // Get folder ID
      const folderId = await this.getOrCreateFolder();

      // Search for backup file
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        throw new Error('No backup file found in Google Drive');
      }

      const fileId = searchData.files[0].id;

      // Download file content
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      
      const downloadResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download backup file');
      }

      const jsonData = await downloadResponse.text();

      // Import to database
      await database.importFromJSON(jsonData);

      console.log('[GoogleDriveSync] Backup downloaded and restored successfully');
      return { success: true };
    } catch (error) {
      console.error('[GoogleDriveSync] Download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('[GoogleDriveSync] Get last sync error:', error);
      return null;
    }
  }

  /**
   * Enable/disable auto sync
   */
  async setAutoSyncEnabled(enabled) {
    try {
      await AsyncStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled.toString());
      console.log('[GoogleDriveSync] Auto sync:', enabled ? 'ENABLED' : 'DISABLED');
    } catch (error) {
      console.error('[GoogleDriveSync] Set auto sync error:', error);
    }
  }

  /**
   * Check if auto sync is enabled
   */
  async isAutoSyncEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(AUTO_SYNC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[GoogleDriveSync] Check auto sync error:', error);
      return false;
    }
  }

  /**
   * Perform automatic sync (call this after database changes)
   */
  async autoSync() {
    try {
      const isEnabled = await this.isAutoSyncEnabled();
      if (!isEnabled) {
        return { success: false, reason: 'Auto sync disabled' };
      }

      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        return { success: false, reason: 'Not signed in' };
      }

      // Upload backup
      return await this.uploadBackup();
    } catch (error) {
      console.error('[GoogleDriveSync] Auto sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleDriveSyncService();
