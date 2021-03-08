--
-- File generated with SQLiteStudio v3.2.1 on Fri Sep 18 22:10:27 2020
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: ElectricConsumption
DROP TABLE IF EXISTS ElectricConsumption;

CREATE TABLE ElectricConsumption (
    id               INTEGER PRIMARY KEY,
    serviceAddressId INTEGER,
    date             DATE,
    month            TEXT,
    year             NUMERIC,
    kwhConsumption   REAL,
    FOREIGN KEY (
        serviceAddressId
    )
    REFERENCES ServiceAddress (id) 
);


-- Table: GRU_Import
DROP TABLE IF EXISTS GRU_Import;

CREATE TABLE GRU_Import (
    [Service Address] TEXT,
    [Service City]    TEXT,
    Month             TEXT,
    Year              INTEGER,
    Date              DATE,
    [KWH Consumption] REAL,
    Latitude          REAL,
    Longitude         REAL,
    Location          TEXT
);


-- Table: ServiceAddress
DROP TABLE IF EXISTS ServiceAddress;

CREATE TABLE ServiceAddress (
    id        INTEGER PRIMARY KEY,
    address   TEXT,
    city      TEXT,
    latitude  REAL,
    longitude REAL
);


-- Index: idx_GRU_Import_Address
DROP INDEX IF EXISTS idx_GRU_Import_Address;

CREATE INDEX idx_GRU_Import_Address ON GRU_Import (
    "Service Address"
);


-- Index: idxElectricConsumptionServiceAddressDate
DROP INDEX IF EXISTS idxElectricConsumptionServiceAddressDate;

CREATE INDEX idxElectricConsumptionServiceAddressDate ON ElectricConsumption (
    serviceAddressId,
    date
);


-- Index: idxElectricConsumptionServiceAddressYearMonth
DROP INDEX IF EXISTS idxElectricConsumptionServiceAddressYearMonth;

CREATE INDEX idxElectricConsumptionServiceAddressYearMonth ON ElectricConsumption (
    serviceAddressId,
    year,
    month
);


-- Index: idxServiceAddressAddress
DROP INDEX IF EXISTS idxServiceAddressAddress;

CREATE UNIQUE INDEX idxServiceAddressAddress ON ServiceAddress (
    address
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
