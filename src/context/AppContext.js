import React, { createContext, useState, useContext, useEffect } from 'react';
import database from '../database/database';
import googleDriveSyncService from '../services/googleDriveSync';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [inProgressServices, setInProgressServices] = useState([]);
  const [commonServices, setCommonServices] = useState([]);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await database.init();
      await loadUserInfo();
      await loadInProgressServices();
      await loadCommonServices();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInfo = async () => {
    const info = await database.getUserInfo();
    setUserInfo(info);
  };

  const loadInProgressServices = async () => {
    const services = await database.getInProgressServices();
    setInProgressServices(services);
  };

  const loadCommonServices = async () => {
    const services = await database.getAllCommonServices();
    setCommonServices(services);
  };

  const refreshInProgressServices = async () => {
    await loadInProgressServices();
  };

  const refreshCommonServices = async () => {
    await loadCommonServices();
  };

  // Trigger auto-sync after data changes
  const triggerAutoSync = async () => {
    try {
      // Run in background, don't wait for it
      googleDriveSyncService.autoSync().catch(error => {
        console.log('[AppContext] Auto sync skipped:', error.message);
      });
    } catch (error) {
      console.log('[AppContext] Auto sync error:', error.message);
    }
  };

  const value = {
    isLoading,
    userInfo,
    inProgressServices,
    commonServices,
    loadUserInfo,
    refreshInProgressServices,
    refreshCommonServices,
    triggerAutoSync,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
