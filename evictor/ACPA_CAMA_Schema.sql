CREATE TABLE CommonCodes (
  [Code_Type] TEXT NOT NULL,
  [Code] TEXT,
  [Code_Description] TEXT
)

CREATE TABLE ExemptionsRE_History (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [Hist_Tax_Year] NUMERIC NOT NULL,
  [Hist_Ex_Code] TEXT NOT NULL,
  [Hist_Ex_Desc] TEXT NOT NULL,
  [Hist_Ex_Amount] NUMERIC NOT NULL
)

CREATE TABLE HistoryRE (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [Hist_Tax_Year] NUMERIC NOT NULL,
  [City_Code] TEXT NOT NULL,
  [City_Name] TEXT NOT NULL,
  [Prop_Use_Code] TEXT,
  [Prop_Use_Desc] TEXT NOT NULL,
  [Value_By] TEXT,
  [Just_Value] NUMERIC,
  [Deferred_Value] NUMERIC,
  [County_Assessed_Value] NUMERIC,
  [County_Exempt_Amount] NUMERIC NOT NULL,
  [County_Taxable_Value] NUMERIC NOT NULL,
  [School_Assessed_Value] NUMERIC NOT NULL,
  [School_Exempt_Amount] NUMERIC NOT NULL,
  [School_Taxable_Value] NUMERIC NOT NULL,
  [Land_Value] NUMERIC,
  [Classified_Land_Value] NUMERIC,
  [Improvement_Value] NUMERIC,
  [Heated_SquareFeet] NUMERIC
)

CREATE TABLE Improvements (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [TaxYear] NUMERIC NOT NULL,
  [Imprv_ID] INTEGER NOT NULL,
  [Imprv_Type] TEXT NOT NULL,
  [Imprv_Desc] TEXT,
  [Effective_YrBlt] NUMERIC,
  [Actual_YrBlt] NUMERIC,
  [Bldg_Num] TEXT,
  [Heated_SquareFeet] NUMERIC,
  [Stories] NUMERIC
)

CREATE TABLE ImprvAttributes (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [Imprv_ID] INTEGER NOT NULL,
  [Imprv_Attribute] TEXT,
  [Imprv_Attr_Desc] TEXT NOT NULL,
  [Imprv_Attr_Units] NUMERIC
)

CREATE TABLE ImprvDetails (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [TaxYear] NUMERIC NOT NULL,
  [Imprv_ID] INTEGER NOT NULL,
  [Imprv_Detail_ID] INTEGER NOT NULL,
  [Imprv_Detail_Type] TEXT NOT NULL,
  [Imprv_Desc] TEXT,
  [Imprv_SqFt] NUMERIC,
  [Quality_Code] TEXT,
  [Quality_Desc] TEXT,
  [Bldg_Use_Code] TEXT,
  [Bldg_Use_Desc] TEXT,
  [Style] TEXT NOT NULL,
  [Style_Desc] TEXT
)

CREATE TABLE Land (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [RollYear] NUMERIC,
  [Land_Line_Num] INTEGER,
  [Land_Use_Code] TEXT,
  [Land_Use_Desc] TEXT,
  [Land_Zoning_Code] TEXT,
  [Land_Zoning_Desc] TEXT,
  [Land_Acres] NUMERIC,
  [Land_SqFt] NUMERIC,
  [Land_Lots] NUMERIC,
  [Land_Type] TEXT
)

CREATE TABLE Legals (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  Legal_Desc TEXT
)

CREATE TABLE Owners (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [Owner_Mail_Name] TEXT,
  [Owner_Mail_Addr1] TEXT,
  [Owner_Mail_Addr2] TEXT,
  [Owner_Mail_Addr3] TEXT,
  [Owner_Mail_City] TEXT,
  [Owner_Mail_State] TEXT,
  [Owner_Mail_Zip] TEXT,
  [Owner_Mail_Country] TEXT
)

CREATE TABLE Permits (
  [Parcel] TEXT,
  [prop_id] INTEGER,
  [Permit_Num] TEXT,
  [Permit_Type] TEXT,
  [Permit_Desc] TEXT,
  [Permit_Issue_Date] DATE,
  [Permit_Completion_Date] DATE,
  [Permit_Inspection_Date] DATE,
  [Permit_Amount] NUMERIC,
  [Permit_Comment] TEXT
)

CREATE TABLE Property (
  [Parcel] TEXT,
  [prop_id] INTEGER PRIMARY KEY NOT NULL,
  [Section] TEXT,
  [Township] TEXT,
  [Range] TEXT,
  [City_Code] TEXT NOT NULL,
  [City_Desc] TEXT NOT NULL,
  [Prop_Use_Code] TEXT,
  [Prop_Use_Desc] TEXT NOT NULL,
  [NBHD_Code] TEXT,
  [NBHD_Desc] TEXT,
  [SBDV_Code] TEXT,
  [SBDV_Desc] TEXT,
  [Cycle] NUMERIC,
  [Hmstd] TEXT NOT NULL,
  [TotSqFt] TEXT NOT NULL,
  [HtdSqFt] NUMERIC,
  [Acres] NUMERIC
)

CREATE TABLE Sales (
  [Parcel] TEXT,
  [prop_id] INTEGER NOT NULL,
  [Sale_Line_Num] INTEGER,
  [Sale_Date] DATE,
  [Sale_Price] NUMERIC,
  [Sale_Vac_Imp] TEXT NOT NULL,
  [Sale_Qualified] TEXT,
  [Sale_Book] TEXT,
  [Sale_Page] TEXT,
  [Sale_Deed_Type] TEXT,
  [DOR_Qual_Code] TEXT
)
