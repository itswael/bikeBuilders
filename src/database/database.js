import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('bikeBuilders.db');

class Database {
  constructor() {
    this.db = db;
  }

  // Helper to execute SQL with promise
  executeSql(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            reject(error);
            return true;
          }
        );
      });
    });
  }

  async init() {
    try {
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS Customers (
        CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Phone TEXT UNIQUE,
        Address TEXT,
        Email TEXT UNIQUE
      )`,
      `CREATE TABLE IF NOT EXISTS Vehicles (
        RegNumber TEXT PRIMARY KEY,
        CustomerID INTEGER NOT NULL,
        VehicleName TEXT,
        LastServiceDate TEXT,
        LastReading INTEGER
      )`,
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
        StartedOn TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS ServiceParts (
        PartLogID INTEGER PRIMARY KEY AUTOINCREMENT,
        ServiceLogID INTEGER NOT NULL,
        PartName TEXT NOT NULL,
        Amount REAL NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS CommonServices (
        ServiceID INTEGER PRIMARY KEY AUTOINCREMENT,
        ServiceName TEXT NOT NULL UNIQUE,
        DefaultAmount REAL NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS UserInfo (
        UserID INTEGER PRIMARY KEY CHECK (UserID = 1),
        Name TEXT,
        Email TEXT,
        PhoneNumber TEXT,
        GarageName TEXT,
        Address TEXT
      )`,
    ];

    for (const sql of tables) {
      await this.executeSql(sql);
    }

    // Insert default user info
    await this.executeSql(
      'INSERT OR IGNORE INTO UserInfo (UserID, Name, Email, PhoneNumber, GarageName, Address) VALUES (?, ?, ?, ?, ?, ?)',
      [1, '', '', '', '', '']
    );
  }

  // Customer operations
  async addCustomer(name, phone, address, email) {
    const result = await this.executeSql(
      'INSERT INTO Customers (Name, Phone, Address, Email) VALUES (?, ?, ?, ?)',
      [name, phone, address, email]
    );
    return result.insertId;
  }

  async getCustomerById(customerId) {
    const result = await this.executeSql(
      'SELECT * FROM Customers WHERE CustomerID = ?',
      [customerId]
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async updateCustomer(customerId, name, phone, address, email) {
    await this.executeSql(
      'UPDATE Customers SET Name = ?, Phone = ?, Address = ?, Email = ? WHERE CustomerID = ?',
      [name, phone, address, email, customerId]
    );
  }

  // Vehicle operations
  async addVehicle(regNumber, customerId, vehicleName) {
    await this.executeSql(
      'INSERT INTO Vehicles (RegNumber, CustomerID, VehicleName) VALUES (?, ?, ?)',
      [regNumber, customerId, vehicleName]
    );
  }

  async getVehicleByRegNumber(regNumber) {
    const result = await this.executeSql(
      `SELECT v.*, c.Name as OwnerName, c.Phone, c.Address, c.Email 
       FROM Vehicles v 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE LOWER(v.RegNumber) = LOWER(?)`,
      [regNumber]
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async updateVehicle(regNumber, customerId, vehicleName, lastServiceDate, lastReading) {
    await this.executeSql(
      'UPDATE Vehicles SET CustomerID = ?, VehicleName = ?, LastServiceDate = ?, LastReading = ? WHERE RegNumber = ?',
      [customerId, vehicleName, lastServiceDate, lastReading, regNumber]
    );
  }

  async searchVehicles(searchTerm) {
    const result = await this.executeSql(
      `SELECT v.*, c.Name as OwnerName 
       FROM Vehicles v 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE LOWER(v.RegNumber) LIKE LOWER(?)`,
      [`%${searchTerm}%`]
    );
    const items = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  }

  // Service operations
  async addService(regNumber, currentReading, totalAmount, startedOn) {
    const timestampKey = Date.now();
    const result = await this.executeSql(
      'INSERT INTO Services (RegNumber, TimestampKey, CurrentReading, TotalAmount, StartedOn) VALUES (?, ?, ?, ?, ?)',
      [regNumber, timestampKey, currentReading, totalAmount, startedOn]
    );
    return result.insertId;
  }

  async getServiceById(serviceLogId) {
    const result = await this.executeSql(
      'SELECT * FROM Services WHERE ServiceLogID = ?',
      [serviceLogId]
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async getInProgressServices() {
    const result = await this.executeSql(
      `SELECT s.*, v.RegNumber, c.Name as OwnerName 
       FROM Services s 
       JOIN Vehicles v ON s.RegNumber = v.RegNumber 
       JOIN Customers c ON v.CustomerID = c.CustomerID 
       WHERE s.Status = 'In Progress'
       ORDER BY s.TimestampKey DESC`
    );
    const items = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  }

  async getServicesByRegNumber(regNumber) {
    const result = await this.executeSql(
      'SELECT * FROM Services WHERE RegNumber = ? ORDER BY TimestampKey DESC',
      [regNumber]
    );
    const items = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  }

  async updateService(serviceLogId, paidAmount, status, completedOn, outstandingBalance, paymentStatus) {
    await this.executeSql(
      'UPDATE Services SET PaidAmount = ?, Status = ?, CompletedOn = ?, OutstandingBalance = ?, PaymentStatus = ? WHERE ServiceLogID = ?',
      [paidAmount, status, completedOn, outstandingBalance, paymentStatus, serviceLogId]
    );
  }

  async getTotalOutstandingBalance(regNumber) {
    const result = await this.executeSql(
      'SELECT SUM(OutstandingBalance) as TotalBalance FROM Services WHERE RegNumber = ?',
      [regNumber]
    );
    return result.rows.length > 0 ? (result.rows.item(0).TotalBalance || 0) : 0;
  }

  // ServiceParts operations
  async addServicePart(serviceLogId, partName, amount) {
    await this.executeSql(
      'INSERT INTO ServiceParts (ServiceLogID, PartName, Amount) VALUES (?, ?, ?)',
      [serviceLogId, partName, amount]
    );
  }

  async getServiceParts(serviceLogId) {
    const result = await this.executeSql(
      'SELECT * FROM ServiceParts WHERE ServiceLogID = ?',
      [serviceLogId]
    );
    const items = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  }

  // CommonServices operations
  async addCommonService(serviceName, defaultAmount) {
    await this.executeSql(
      'INSERT INTO CommonServices (ServiceName, DefaultAmount) VALUES (?, ?)',
      [serviceName, defaultAmount]
    );
  }

  async getAllCommonServices() {
    const result = await this.executeSql(
      'SELECT * FROM CommonServices ORDER BY ServiceName'
    );
    const items = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    return items;
  }

  async updateCommonService(serviceId, serviceName, defaultAmount) {
    await this.executeSql(
      'UPDATE CommonServices SET ServiceName = ?, DefaultAmount = ? WHERE ServiceID = ?',
      [serviceName, defaultAmount, serviceId]
    );
  }

  async deleteCommonService(serviceId) {
    await this.executeSql(
      'DELETE FROM CommonServices WHERE ServiceID = ?',
      [serviceId]
    );
  }

  // UserInfo operations
  async getUserInfo() {
    const result = await this.executeSql(
      'SELECT * FROM UserInfo WHERE UserID = 1'
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async updateUserInfo(name, email, phoneNumber, garageName, address) {
    await this.executeSql(
      'UPDATE UserInfo SET Name = ?, Email = ?, PhoneNumber = ?, GarageName = ?, Address = ? WHERE UserID = 1',
      [name, email, phoneNumber, garageName, address]
    );
  }

  // Export/Import for Google Drive backup
  async exportToJSON() {
    const customers = await this.executeSql('SELECT * FROM Customers');
    const vehicles = await this.executeSql('SELECT * FROM Vehicles');
    const services = await this.executeSql('SELECT * FROM Services');
    const serviceParts = await this.executeSql('SELECT * FROM ServiceParts');
    const commonServices = await this.executeSql('SELECT * FROM CommonServices');
    const userInfo = await this.getUserInfo();

    const data = {
      customers: this._rowsToArray(customers.rows),
      vehicles: this._rowsToArray(vehicles.rows),
      services: this._rowsToArray(services.rows),
      serviceParts: this._rowsToArray(serviceParts.rows),
      commonServices: this._rowsToArray(commonServices.rows),
      userInfo: userInfo,
    };
    return JSON.stringify(data);
  }

  _rowsToArray(rows) {
    const items = [];
    for (let i = 0; i < rows.length; i++) {
      items.push(rows.item(i));
    }
    return items;
  }

  async importFromJSON(jsonData) {
    const data = JSON.parse(jsonData);
    
    // Clear existing data
    await this.executeSql('DELETE FROM ServiceParts');
    await this.executeSql('DELETE FROM Services');
    await this.executeSql('DELETE FROM Vehicles');
    await this.executeSql('DELETE FROM Customers');
    await this.executeSql('DELETE FROM CommonServices');
    
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
