import * as SQLite from 'expo-sqlite';

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('bikeBuilders.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Customers Table
      `CREATE TABLE IF NOT EXISTS Customers (
        CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Phone TEXT UNIQUE,
        Address TEXT,
        Email TEXT UNIQUE
      );`,
      
      // Vehicles Table
      `CREATE TABLE IF NOT EXISTS Vehicles (
        RegNumber TEXT PRIMARY KEY,
        CustomerID INTEGER NOT NULL,
        VehicleName TEXT,
        LastServiceDate TEXT,
        LastReading INTEGER,
        FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
      );`,
      
      // Services Table
      `CREATE TABLE IF NOT EXISTS Services (
        ServiceLogID INTEGER PRIMARY KEY AUTOINCREMENT,
        RegNumber TEXT NOT NULL,
        TimestampKey INTEGER NOT NULL,
        CurrentReading INTEGER,
        TotalAmount REAL DEFAULT 0,
        PaymentStatus TEXT DEFAULT 'Pending',
        PaidAmount REAL DEFAULT 0,
        Status TEXT DEFAULT 'In Progress',
        CompletedOn TEXT,
        OutstandingBalance REAL DEFAULT 0,
        StartedOn TEXT,
        FOREIGN KEY (RegNumber) REFERENCES Vehicles(RegNumber)
      );`,
      
      // ServiceParts Table
      `CREATE TABLE IF NOT EXISTS ServiceParts (
        PartLogID INTEGER PRIMARY KEY AUTOINCREMENT,
        ServiceLogID INTEGER NOT NULL,
        PartName TEXT NOT NULL,
        Amount REAL NOT NULL,
        FOREIGN KEY (ServiceLogID) REFERENCES Services(ServiceLogID)
      );`,
      
      // CommonServices Table (for admin-managed services/parts inventory)
      `CREATE TABLE IF NOT EXISTS CommonServices (
        ServiceID INTEGER PRIMARY KEY AUTOINCREMENT,
        ServiceName TEXT NOT NULL UNIQUE,
        DefaultAmount REAL NOT NULL
      );`,
      
      // UserInfo Table
      `CREATE TABLE IF NOT EXISTS UserInfo (
        UserID INTEGER PRIMARY KEY CHECK (UserID = 1),
        Name TEXT,
        Email TEXT,
        PhoneNumber TEXT,
        GarageName TEXT,
        Address TEXT
      );`
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
    
    // Insert default user info row if not exists
    await this.db.runAsync(
      'INSERT OR IGNORE INTO UserInfo (UserID, Name, Email, PhoneNumber, GarageName, Address) VALUES (1, "", "", "", "", "")'
    );
  }

  // Customer operations
  async addCustomer(name, phone, address, email) {
    const result = await this.db.runAsync(
      'INSERT INTO Customers (Name, Phone, Address, Email) VALUES (?, ?, ?, ?)',
      [name, phone, address, email]
    );
    return result.lastInsertRowId;
  }

  async getCustomerById(customerId) {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM Customers WHERE CustomerID = ?',
      [customerId]
    );
    return result;
  }

  async updateCustomer(customerId, name, phone, address, email) {
    await this.db.runAsync(
      'UPDATE Customers SET Name = ?, Phone = ?, Address = ?, Email = ? WHERE CustomerID = ?',
      [name, phone, address, email, customerId]
    );
  }

  // Vehicle operations
  async addVehicle(regNumber, customerId, vehicleName) {
    await this.db.runAsync(
      'INSERT INTO Vehicles (RegNumber, CustomerID, VehicleName) VALUES (?, ?, ?)',
      [regNumber, customerId, vehicleName]
    );
  }

  async getVehicleByRegNumber(regNumber) {
    const result = await this.db.getFirstAsync(
      `SELECT v.*, c.Name as OwnerName, c.Phone, c.Address, c.Email 
       FROM Vehicles v 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE v.RegNumber = ?`,
      [regNumber]
    );
    return result;
  }

  async updateVehicle(regNumber, customerId, vehicleName, lastServiceDate, lastReading) {
    await this.db.runAsync(
      'UPDATE Vehicles SET CustomerID = ?, VehicleName = ?, LastServiceDate = ?, LastReading = ? WHERE RegNumber = ?',
      [customerId, vehicleName, lastServiceDate, lastReading, regNumber]
    );
  }

  async searchVehicles(searchTerm) {
    const result = await this.db.getAllAsync(
      `SELECT v.*, c.Name as OwnerName 
       FROM Vehicles v 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE v.RegNumber LIKE ?`,
      [`%${searchTerm}%`]
    );
    return result;
  }

  // Service operations
  async addService(regNumber, currentReading, totalAmount, startedOn) {
    const timestampKey = Date.now();
    const result = await this.db.runAsync(
      'INSERT INTO Services (RegNumber, TimestampKey, CurrentReading, TotalAmount, StartedOn) VALUES (?, ?, ?, ?, ?)',
      [regNumber, timestampKey, currentReading, totalAmount, startedOn]
    );
    return result.lastInsertRowId;
  }

  async getServiceById(serviceLogId) {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM Services WHERE ServiceLogID = ?',
      [serviceLogId]
    );
    return result;
  }

  async getInProgressServices() {
    const result = await this.db.getAllAsync(
      `SELECT s.*, v.RegNumber, c.Name as OwnerName 
       FROM Services s 
       JOIN Vehicles v ON s.RegNumber = v.RegNumber 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE s.Status = 'In Progress'
       ORDER BY s.TimestampKey DESC`
    );
    return result;
  }

  async getServicesByRegNumber(regNumber) {
    const result = await this.db.getAllAsync(
      'SELECT * FROM Services WHERE RegNumber = ? ORDER BY TimestampKey DESC',
      [regNumber]
    );
    return result;
  }

  async updateService(serviceLogId, paidAmount, status, completedOn, outstandingBalance, paymentStatus) {
    await this.db.runAsync(
      'UPDATE Services SET PaidAmount = ?, Status = ?, CompletedOn = ?, OutstandingBalance = ?, PaymentStatus = ? WHERE ServiceLogID = ?',
      [paidAmount, status, completedOn, outstandingBalance, paymentStatus, serviceLogId]
    );
  }

  // ServiceParts operations
  async addServicePart(serviceLogId, partName, amount) {
    await this.db.runAsync(
      'INSERT INTO ServiceParts (ServiceLogID, PartName, Amount) VALUES (?, ?, ?)',
      [serviceLogId, partName, amount]
    );
  }

  async getServiceParts(serviceLogId) {
    const result = await this.db.getAllAsync(
      'SELECT * FROM ServiceParts WHERE ServiceLogID = ?',
      [serviceLogId]
    );
    return result;
  }

  // CommonServices operations
  async addCommonService(serviceName, defaultAmount) {
    await this.db.runAsync(
      'INSERT INTO CommonServices (ServiceName, DefaultAmount) VALUES (?, ?)',
      [serviceName, defaultAmount]
    );
  }

  async getAllCommonServices() {
    const result = await this.db.getAllAsync(
      'SELECT * FROM CommonServices ORDER BY ServiceName'
    );
    return result;
  }

  async updateCommonService(serviceId, serviceName, defaultAmount) {
    await this.db.runAsync(
      'UPDATE CommonServices SET ServiceName = ?, DefaultAmount = ? WHERE ServiceID = ?',
      [serviceName, defaultAmount, serviceId]
    );
  }

  async deleteCommonService(serviceId) {
    await this.db.runAsync(
      'DELETE FROM CommonServices WHERE ServiceID = ?',
      [serviceId]
    );
  }

  // UserInfo operations
  async getUserInfo() {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM UserInfo WHERE UserID = 1'
    );
    return result;
  }

  async updateUserInfo(name, email, phoneNumber, garageName, address) {
    await this.db.runAsync(
      'UPDATE UserInfo SET Name = ?, Email = ?, PhoneNumber = ?, GarageName = ?, Address = ? WHERE UserID = 1',
      [name, email, phoneNumber, garageName, address]
    );
  }

  // Export/Import for Google Drive backup
  async exportToJSON() {
    const data = {
      customers: await this.db.getAllAsync('SELECT * FROM Customers'),
      vehicles: await this.db.getAllAsync('SELECT * FROM Vehicles'),
      services: await this.db.getAllAsync('SELECT * FROM Services'),
      serviceParts: await this.db.getAllAsync('SELECT * FROM ServiceParts'),
      commonServices: await this.db.getAllAsync('SELECT * FROM CommonServices'),
      userInfo: await this.getUserInfo(),
    };
    return JSON.stringify(data);
  }

  async importFromJSON(jsonData) {
    const data = JSON.parse(jsonData);
    
    // Clear existing data
    await this.db.execAsync('DELETE FROM ServiceParts');
    await this.db.execAsync('DELETE FROM Services');
    await this.db.execAsync('DELETE FROM Vehicles');
    await this.db.execAsync('DELETE FROM Customers');
    await this.db.execAsync('DELETE FROM CommonServices');
    
    // Import customers
    for (const customer of data.customers || []) {
      await this.addCustomer(customer.Name, customer.Phone, customer.Address, customer.Email);
    }
    
    // Import vehicles
    for (const vehicle of data.vehicles || []) {
      await this.addVehicle(vehicle.RegNumber, vehicle.CustomerID, vehicle.VehicleName);
      if (vehicle.LastServiceDate || vehicle.LastReading) {
        await this.updateVehicle(vehicle.RegNumber, vehicle.CustomerID, vehicle.VehicleName, vehicle.LastServiceDate, vehicle.LastReading);
      }
    }
    
    // Import services
    for (const service of data.services || []) {
      const serviceId = await this.addService(service.RegNumber, service.CurrentReading, service.TotalAmount, service.StartedOn);
      if (service.Status === 'Completed') {
        await this.updateService(serviceId, service.PaidAmount, service.Status, service.CompletedOn, service.OutstandingBalance, service.PaymentStatus);
      }
    }
    
    // Import service parts
    for (const part of data.serviceParts || []) {
      await this.addServicePart(part.ServiceLogID, part.PartName, part.Amount);
    }
    
    // Import common services
    for (const commonService of data.commonServices || []) {
      await this.addCommonService(commonService.ServiceName, commonService.DefaultAmount);
    }
    
    // Import user info
    if (data.userInfo) {
      await this.updateUserInfo(
        data.userInfo.Name,
        data.userInfo.Email,
        data.userInfo.PhoneNumber,
        data.userInfo.GarageName,
        data.userInfo.Address
      );
    }
  }
}

export default new Database();
