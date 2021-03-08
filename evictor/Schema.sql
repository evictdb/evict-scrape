--
-- File generated with SQLiteStudio v3.2.1 on Mon Sep 21 20:30:06 2020
--
-- Text encoding used: UTF-8
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: AddressPoints
DROP TABLE IF EXISTS AddressPoints;

CREATE TABLE AddressPoints (
    X                REAL,
    Y                REAL,
    OBJECTID         INTEGER  PRIMARY KEY,
    FULLADDR         TEXT,
    ADD_NUMBER       TEXT,
    LST_PREDIR       TEXT,
    LST_NAME         TEXT,
    LST_TYPE         TEXT,
    UNIT             TEXT,
    STATUS           TEXT,
    ADDRTYPE         TEXT,
    PARCEL           TEXT,
    INC_MUNI         TEXT,
    MSAGCOMM         TEXT,
    POST_CODE        TEXT,
    ESN              TEXT,
    NBRHD_COMM       TEXT,
    LANDMKNAME       TEXT,
    ADDTL_LOC        TEXT,
    TRACK_NUM        TEXT,
    COUNTRY          TEXT,
    STATE            TEXT,
    COUNTY           TEXT,
    ST_PREDIR        TEXT,
    ST_PRETYP        TEXT,
    ST_NAME          TEXT,
    ST_POSTYP        TEXT,
    DATEUPDATE       DATETIME,
    created_date     DATETIME,
    last_edited_date DATETIME,
    DISCRPAGID       TEXT,
    SITE_NGUID       TEXT,
    GlobalID         TEXT
);


-- Table: CAMA_CommonCodes
DROP TABLE IF EXISTS CAMA_CommonCodes;

CREATE TABLE CAMA_CommonCodes (
    Code_Type        TEXT NOT NULL,
    Code             TEXT,
    Code_Description TEXT
);


-- Table: CAMA_ExemptionsRE_History
DROP TABLE IF EXISTS CAMA_ExemptionsRE_History;

CREATE TABLE CAMA_ExemptionsRE_History (
    Parcel         TEXT,
    prop_id        INTEGER NOT NULL
                           REFERENCES CAMA_Property (prop_id),
    Hist_Tax_Year  NUMERIC NOT NULL,
    Hist_Ex_Code   TEXT    NOT NULL,
    Hist_Ex_Desc   TEXT    NOT NULL,
    Hist_Ex_Amount NUMERIC NOT NULL
);


-- Table: CAMA_HistoryRE
DROP TABLE IF EXISTS CAMA_HistoryRE;

CREATE TABLE CAMA_HistoryRE (
    Parcel                TEXT,
    prop_id               INTEGER NOT NULL
                                  REFERENCES CAMA_Property (prop_id),
    Hist_Tax_Year         NUMERIC NOT NULL,
    City_Code             TEXT    NOT NULL,
    City_Name             TEXT    NOT NULL,
    Prop_Use_Code         TEXT,
    Prop_Use_Desc         TEXT    NOT NULL,
    Value_By              TEXT,
    Just_Value            NUMERIC,
    Deferred_Value        NUMERIC,
    County_Assessed_Value NUMERIC,
    County_Exempt_Amount  NUMERIC NOT NULL,
    County_Taxable_Value  NUMERIC NOT NULL,
    School_Assessed_Value NUMERIC NOT NULL,
    School_Exempt_Amount  NUMERIC NOT NULL,
    School_Taxable_Value  NUMERIC NOT NULL,
    Land_Value            NUMERIC,
    Classified_Land_Value NUMERIC,
    Improvement_Value     NUMERIC,
    Heated_SquareFeet     NUMERIC
);


-- Table: CAMA_Improvements
DROP TABLE IF EXISTS CAMA_Improvements;

CREATE TABLE CAMA_Improvements (
    Parcel            TEXT,
    prop_id           INTEGER NOT NULL
                              REFERENCES CAMA_Property (prop_id),
    TaxYear           NUMERIC NOT NULL,
    Imprv_ID          INTEGER NOT NULL
                              PRIMARY KEY,
    Imprv_Type        TEXT    NOT NULL,
    Imprv_Desc        TEXT,
    Effective_YrBlt   NUMERIC,
    Actual_YrBlt      NUMERIC,
    Bldg_Num          TEXT,
    Heated_SquareFeet NUMERIC,
    Stories           NUMERIC
);


-- Table: CAMA_ImprvAttributes
DROP TABLE IF EXISTS CAMA_ImprvAttributes;

CREATE TABLE CAMA_ImprvAttributes (
    Parcel           TEXT,
    prop_id          INTEGER NOT NULL
                             REFERENCES CAMA_Property (prop_id),
    Imprv_ID         INTEGER NOT NULL
                             REFERENCES CAMA_Improvements (Imprv_ID),
    Imprv_Attribute  TEXT,
    Imprv_Attr_Desc  TEXT    NOT NULL,
    Imprv_Attr_Units NUMERIC
);


-- Table: CAMA_ImprvDetails
DROP TABLE IF EXISTS CAMA_ImprvDetails;

CREATE TABLE CAMA_ImprvDetails (
    Parcel            TEXT,
    prop_id           INTEGER NOT NULL
                              REFERENCES CAMA_Property (prop_id),
    TaxYear           NUMERIC NOT NULL,
    Imprv_ID          INTEGER NOT NULL
                              REFERENCES CAMA_Improvements (Imprv_ID),
    Imprv_Detail_ID   INTEGER NOT NULL,
    Imprv_Detail_Type TEXT    NOT NULL,
    Imprv_Desc        TEXT,
    Imprv_SqFt        NUMERIC,
    Quality_Code      TEXT,
    Quality_Desc      TEXT,
    Bldg_Use_Code     TEXT,
    Bldg_Use_Desc     TEXT,
    Style             TEXT    NOT NULL,
    Style_Desc        TEXT
);


-- Table: CAMA_Land
DROP TABLE IF EXISTS CAMA_Land;

CREATE TABLE CAMA_Land (
    Parcel           TEXT,
    prop_id          INTEGER NOT NULL
                             REFERENCES CAMA_Property (prop_id),
    RollYear         NUMERIC,
    Land_Line_Num    INTEGER,
    Land_Use_Code    TEXT,
    Land_Use_Desc    TEXT,
    Land_Zoning_Code TEXT,
    Land_Zoning_Desc TEXT,
    Land_Acres       NUMERIC,
    Land_SqFt        NUMERIC,
    Land_Lots        NUMERIC,
    Land_Type        TEXT
);


-- Table: CAMA_Legals
DROP TABLE IF EXISTS CAMA_Legals;

CREATE TABLE CAMA_Legals (
    Parcel     TEXT,
    prop_id    INTEGER NOT NULL
                       REFERENCES CAMA_Property (prop_id),
    Legal_Desc TEXT
);


-- Table: CAMA_Owners
DROP TABLE IF EXISTS CAMA_Owners;

CREATE TABLE CAMA_Owners (
    Parcel             TEXT,
    prop_id            INTEGER NOT NULL
                               REFERENCES CAMA_Property (prop_id),
    Owner_Mail_Name    TEXT,
    Owner_Mail_Addr1   TEXT,
    Owner_Mail_Addr2   TEXT,
    Owner_Mail_Addr3   TEXT,
    Owner_Mail_City    TEXT,
    Owner_Mail_State   TEXT,
    Owner_Mail_Zip     TEXT,
    Owner_Mail_Country TEXT
);


-- Table: CAMA_Permits
DROP TABLE IF EXISTS CAMA_Permits;

CREATE TABLE CAMA_Permits (
    Parcel                 TEXT,
    prop_id                INTEGER REFERENCES CAMA_Property (prop_id),
    Permit_Num             TEXT,
    Permit_Type            TEXT,
    Permit_Desc            TEXT,
    Permit_Issue_Date      DATE,
    Permit_Completion_Date DATE,
    Permit_Inspection_Date DATE,
    Permit_Amount          NUMERIC,
    Permit_Comment         TEXT
);


-- Table: CAMA_Property
DROP TABLE IF EXISTS CAMA_Property;

CREATE TABLE CAMA_Property (
    Parcel        TEXT,
    prop_id       INTEGER PRIMARY KEY
                          NOT NULL,
    Section       TEXT,
    Township      TEXT,
    Range         TEXT,
    City_Code     TEXT    NOT NULL,
    City_Desc     TEXT    NOT NULL,
    Prop_Use_Code TEXT,
    Prop_Use_Desc TEXT    NOT NULL,
    NBHD_Code     TEXT,
    NBHD_Desc     TEXT,
    SBDV_Code     TEXT,
    SBDV_Desc     TEXT,
    Cycle         NUMERIC,
    Hmstd         TEXT    NOT NULL,
    TotSqFt       TEXT    NOT NULL,
    HtdSqFt       NUMERIC,
    Acres         NUMERIC
);


-- Table: CAMA_Sales
DROP TABLE IF EXISTS CAMA_Sales;

CREATE TABLE CAMA_Sales (
    Parcel         TEXT,
    prop_id        INTEGER NOT NULL
                           REFERENCES CAMA_Property (prop_id),
    Sale_Line_Num  INTEGER,
    Sale_Date      DATE,
    Sale_Price     NUMERIC,
    Sale_Vac_Imp   TEXT    NOT NULL,
    Sale_Qualified TEXT,
    Sale_Book      TEXT,
    Sale_Page      TEXT,
    Sale_Deed_Type TEXT,
    DOR_Qual_Code  TEXT
);


-- Table: CourtCase
DROP TABLE IF EXISTS CourtCase;

CREATE TABLE CourtCase (
    id             INTEGER  PRIMARY KEY
                            NOT NULL,
    caseNumber     TEXT     NOT NULL
                            UNIQUE,
    status         TEXT,
    url            TEXT,
    summary        TEXT,
    [action]       TEXT,
    fileDate       DATE     NOT NULL,
    incomplete     BOOLEAN,
    firstRetrieved DATETIME NOT NULL,
    lastUpdate     DATETIME NOT NULL,
    lastVerified   DATETIME NOT NULL
);


-- Table: CourtCaseCost
DROP TABLE IF EXISTS CourtCaseCost;

CREATE TABLE CourtCaseCost (
    courtCaseId    INTEGER  PRIMARY KEY
                            NOT NULL
                            REFERENCES CourtCase (id),
    owed           INTEGER,
    paid           INTEGER,
    dismissed      INTEGER,
    due            INTEGER,
    firstRetrieved DATETIME NOT NULL,
    lastUpdate     DATETIME NOT NULL,
    lastVerified   DATETIME NOT NULL
);


-- Table: CourtCaseDocket
DROP TABLE IF EXISTS CourtCaseDocket;

CREATE TABLE CourtCaseDocket (
    id             INTEGER  PRIMARY KEY
                            NOT NULL,
    courtCaseId    INTEGER  REFERENCES CourtCase (id) 
                            NOT NULL,
    date           DATE,
    text           TEXT,
    amount         INTEGER,
    due            INTEGER,
    link           TEXT,
    firstRetrieved DATETIME NOT NULL,
    lastUpdate     DATETIME NOT NULL,
    lastVerified   DATETIME NOT NULL
);


-- Table: CourtCaseParty
DROP TABLE IF EXISTS CourtCaseParty;

CREATE TABLE CourtCaseParty (
    id                    INTEGER  PRIMARY KEY
                                   NOT NULL,
    courtCaseId           INTEGER  REFERENCES CourtCase (id) 
                                   NOT NULL,
    name                  TEXT     NOT NULL,
    affl                  TEXT,
    type                  TEXT     NOT NULL,
    link                  TEXT,
    residenceAddress      TEXT,
    residenceCityStateZip TEXT,
    mailAddress           TEXT,
    mailCityStateZip      TEXT,
    firstRetrieved        DATETIME NOT NULL,
    lastUpdate            DATETIME NOT NULL,
    lastVerified          DATETIME NOT NULL
);


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


-- Index: idx_AddressPoints_FULLADDR
DROP INDEX IF EXISTS idx_AddressPoints_FULLADDR;

CREATE INDEX idx_AddressPoints_FULLADDR ON AddressPoints (
    FULLADDR
);


-- Index: idx_AddressPoints_parcel_OBJECTID
DROP INDEX IF EXISTS idx_AddressPoints_parcel_OBJECTID;

CREATE INDEX idx_AddressPoints_parcel_OBJECTID ON AddressPoints (
    PARCEL,
    OBJECTID
);


-- Index: idx_cama_commoncodes_code_type_code
DROP INDEX IF EXISTS idx_cama_commoncodes_code_type_code;

CREATE INDEX idx_cama_commoncodes_code_type_code ON CAMA_CommonCodes (
    Code_Type,
    Code
);


-- Index: idx_cama_commoncodes_code_type_code_description
DROP INDEX IF EXISTS idx_cama_commoncodes_code_type_code_description;

CREATE INDEX idx_cama_commoncodes_code_type_code_description ON CAMA_CommonCodes (
    Code_Type,
    Code_Description
);


-- Index: idx_CAMA_ExemptionsRE_History_prop_id_year_code
DROP INDEX IF EXISTS idx_CAMA_ExemptionsRE_History_prop_id_year_code;

CREATE INDEX idx_CAMA_ExemptionsRE_History_prop_id_year_code ON CAMA_ExemptionsRE_History (
    prop_id,
    Hist_Tax_Year,
    Hist_Ex_Code
);


-- Index: idx_CAMA_HistoryRE_prop_id_year
DROP INDEX IF EXISTS idx_CAMA_HistoryRE_prop_id_year;

CREATE INDEX idx_CAMA_HistoryRE_prop_id_year ON CAMA_HistoryRE (
    prop_id,
    Hist_Tax_Year
);


-- Index: idx_CAMA_Improvements_prop_id_year_id
DROP INDEX IF EXISTS idx_CAMA_Improvements_prop_id_year_id;

CREATE INDEX idx_CAMA_Improvements_prop_id_year_id ON CAMA_Improvements (
    prop_id,
    TaxYear,
    Imprv_ID
);


-- Index: idx_CAMA_ImprvAttributes_id
DROP INDEX IF EXISTS idx_CAMA_ImprvAttributes_id;

CREATE INDEX idx_CAMA_ImprvAttributes_id ON CAMA_ImprvAttributes (
    Imprv_ID
);


-- Index: idx_CAMA_ImprvDetails_id
DROP INDEX IF EXISTS idx_CAMA_ImprvDetails_id;

CREATE INDEX idx_CAMA_ImprvDetails_id ON CAMA_ImprvDetails (
    Imprv_ID,
    Imprv_Detail_ID
);


-- Index: idx_CAMA_Land_prop_id
DROP INDEX IF EXISTS idx_CAMA_Land_prop_id;

CREATE INDEX idx_CAMA_Land_prop_id ON CAMA_Land (
    prop_id
);


-- Index: idx_CAMA_Legals_prop_id
DROP INDEX IF EXISTS idx_CAMA_Legals_prop_id;

CREATE INDEX idx_CAMA_Legals_prop_id ON CAMA_Legals (
    prop_id
);


-- Index: idx_CAMA_Owners_prop_id
DROP INDEX IF EXISTS idx_CAMA_Owners_prop_id;

CREATE INDEX idx_CAMA_Owners_prop_id ON CAMA_Owners (
    prop_id
);


-- Index: idx_CAMA_Permits_permitNum
DROP INDEX IF EXISTS idx_CAMA_Permits_permitNum;

CREATE INDEX idx_CAMA_Permits_permitNum ON CAMA_Permits (
    Permit_Num
);


-- Index: idx_CAMA_Permits_prop_id_type
DROP INDEX IF EXISTS idx_CAMA_Permits_prop_id_type;

CREATE INDEX idx_CAMA_Permits_prop_id_type ON CAMA_Permits (
    prop_id,
    Permit_Type
);


-- Index: idx_cama_property_parcel
DROP INDEX IF EXISTS idx_cama_property_parcel;

CREATE INDEX idx_cama_property_parcel ON CAMA_Property (
    Parcel
);


-- Index: idx_CAMA_Sales_prop_id_date
DROP INDEX IF EXISTS idx_CAMA_Sales_prop_id_date;

CREATE INDEX idx_CAMA_Sales_prop_id_date ON CAMA_Sales (
    prop_id,
    Sale_Date
);


-- Index: idx_CourtCase_caseNumber
DROP INDEX IF EXISTS idx_CourtCase_caseNumber;

CREATE INDEX idx_CourtCase_caseNumber ON CourtCase (
    caseNumber
);


-- Index: idx_CourtCase_fileDate_caseNumber
DROP INDEX IF EXISTS idx_CourtCase_fileDate_caseNumber;

CREATE INDEX idx_CourtCase_fileDate_caseNumber ON CourtCase (
    fileDate,
    caseNumber
);


-- Index: idx_CourtCaseDocket_courtCaseId_date_id
DROP INDEX IF EXISTS idx_CourtCaseDocket_courtCaseId_date_id;

CREATE INDEX idx_CourtCaseDocket_courtCaseId_date_id ON CourtCaseDocket (
    courtCaseId,
    date,
    id
);


-- Index: idx_CourtCaseParty_courtCaseId_type_name
DROP INDEX IF EXISTS idx_CourtCaseParty_courtCaseId_type_name;

CREATE INDEX idx_CourtCaseParty_courtCaseId_type_name ON CourtCaseParty (
    courtCaseId,
    type,
    name
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
