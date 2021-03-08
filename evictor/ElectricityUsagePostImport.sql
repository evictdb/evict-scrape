INSERT INTO ServiceAddress (
                               address,
                               city,
                               latitude,
                               longitude
                           )
  SELECT [Service Address] AS address,
       [Service City] AS city,
       Latitude AS latitude,
       Longitude AS longitude
  FROM GRU_Import
  GROUP BY [Service Address];

INSERT INTO ElectricConsumption (
                                    serviceAddressId,
                                    date,
                                    month,
                                    year,
                                    kwhConsumption
                                )
SELECT sa.id as serviceAddressId,
       Date as date,
       Month as month,
       Year as year,
       [KWH Consumption] AS kwhConsumption
  FROM GRU_Import gru
  JOIN ServiceAddress sa ON gru."Service Address" = sa.address;