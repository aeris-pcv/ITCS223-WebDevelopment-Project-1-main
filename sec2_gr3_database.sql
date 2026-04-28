DROP DATABASE IF EXISTS long_gone_db;
CREATE DATABASE long_gone_db;
USE long_gone_db;

-- TABLE DEFINITIONS

CREATE TABLE HouseCategory (
    categoryID   CHAR(8)        NOT NULL,
    CategoryName VARCHAR(50)    NOT NULL,
    description  VARCHAR(2000)  NULL,
    createdDate  DATE           NOT NULL,
    CONSTRAINT PK_HouseCategory PRIMARY KEY (categoryID)
);

CREATE TABLE Area (
    AreaName    VARCHAR(50)  NOT NULL,
    Province    VARCHAR(50)  NOT NULL,
    District    VARCHAR(50)  NOT NULL,
    Subdistrict VARCHAR(50)  NOT NULL,
    Zipcode     VARCHAR(50)  NOT NULL,
    CONSTRAINT PK_Area PRIMARY KEY (AreaName)
);

CREATE TABLE House (
    HouseID       CHAR(11)       NOT NULL,
    HouseName     VARCHAR(50)    NOT NULL,
    bedroomCount  INT            NOT NULL CHECK (bedroomCount  BETWEEN 0 AND 20),
    bathroomCount INT            NOT NULL CHECK (bathroomCount BETWEEN 0 AND 20),
    basementCount INT            NOT NULL CHECK (basementCount BETWEEN 0 AND 5),
    Description   VARCHAR(2000)  NULL,
    HcategoryID   CHAR(8)        NOT NULL,
    HAreaName     VARCHAR(50)    NOT NULL,
    BuyingStatus  BOOLEAN        NOT NULL,
    RentingStatus BOOLEAN        NOT NULL,
    BuyingPrice   DECIMAL(10,2)  NOT NULL,
    RentingPrice  DECIMAL(10,2)  NOT NULL,
    CONSTRAINT PK_House PRIMARY KEY (HouseID),
    CONSTRAINT FK_House_HouseCategory FOREIGN KEY (HcategoryID) REFERENCES HouseCategory (categoryID),
    CONSTRAINT FK_House_Area          FOREIGN KEY (HAreaName)   REFERENCES Area (AreaName)
);

CREATE TABLE Photo (
    PhotoID      CHAR(8)        NOT NULL CHECK (PhotoID > '0'),
    Pdescription VARCHAR(2000)  NULL,
    PhotoRef     VARCHAR(6000)  NOT NULL,
    PHouseID     CHAR(11)       NOT NULL,
    CONSTRAINT PK_Photo        PRIMARY KEY (PhotoID),
    CONSTRAINT FK_Photo_House  FOREIGN KEY (PHouseID) REFERENCES House (HouseID)
);

CREATE TABLE Customer (
    CustomerID          CHAR(10)    NOT NULL CHECK (CustomerID > '0'),
    CName               VARCHAR(50) NOT NULL,
    CustomerGmail       VARCHAR(50) NOT NULL,
    CustomerPhoneNumber VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Customer PRIMARY KEY (CustomerID)
);

CREATE TABLE Admin (
    AdminID          CHAR(10)       NOT NULL CHECK (AdminID > '0'),
    Aname            VARCHAR(50)    NOT NULL,
    AdminGmail       VARCHAR(50)    NOT NULL,
    AdminPhoneNumber VARCHAR(12)    NOT NULL,
    Salary           DECIMAL(10,2)  NOT NULL,
    Password         VARCHAR(255)   NOT NULL,
    CONSTRAINT PK_Admin PRIMARY KEY (AdminID)
);

CREATE TABLE AdminAccount (
    AdminAccID          CHAR(10)    NOT NULL,
    AdminAccName        VARCHAR(50) NOT NULL,
    AdminAccGmail       VARCHAR(50) NOT NULL,
    AdminAccPhoneNumber VARCHAR(12) NOT NULL,
    ACAdminID           CHAR(10)    NOT NULL,
    CONSTRAINT PK_AdminAccount        PRIMARY KEY (AdminAccID),
    CONSTRAINT FK_AdminAccount_Admin  FOREIGN KEY (ACAdminID) REFERENCES Admin (AdminID)
);

CREATE TABLE HouseBroker (
    HBID          CHAR(11)       NOT NULL,
    HBname        VARCHAR(50)    NOT NULL,
    HBPhoneNumber VARCHAR(12)    NOT NULL,
    HBGmail       VARCHAR(50)    NOT NULL,
    Wage          DECIMAL(10,2)  NOT NULL,
    HBAdminID     CHAR(10)       NOT NULL,
    CONSTRAINT PK_HouseBroker        PRIMARY KEY (HBID),
    CONSTRAINT FK_HouseBroker_Admin  FOREIGN KEY (HBAdminID) REFERENCES Admin (AdminID)
);

CREATE TABLE Rating (
    RCustomerID  CHAR(10)      NOT NULL,
    RHouseID     CHAR(11)      NOT NULL,
    RatingValue  DECIMAL(3,2)  NOT NULL,
    Date         DATE          NOT NULL,
    CONSTRAINT PK_Rating          PRIMARY KEY (RCustomerID, RHouseID),
    CONSTRAINT FK_Rating_Customer FOREIGN KEY (RCustomerID) REFERENCES Customer (CustomerID),
    CONSTRAINT FK_Rating_House    FOREIGN KEY (RHouseID)    REFERENCES House (HouseID)
);

CREATE TABLE Manage (
    MAdminAccID  CHAR(10)    NOT NULL,
    MHouseID     CHAR(11)    NOT NULL,
    UpdateDate   DATE        NOT NULL,
    UpdateType   VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Manage                PRIMARY KEY (MAdminAccID, MHouseID),
    CONSTRAINT FK_Manage_AdminAccount   FOREIGN KEY (MAdminAccID) REFERENCES AdminAccount (AdminAccID),
    CONSTRAINT FK_Manage_House          FOREIGN KEY (MHouseID)    REFERENCES House (HouseID)
);

CREATE TABLE Contain (
    CHouseID    CHAR(11)  NOT NULL,
    CcategoryID CHAR(8)   NOT NULL,
    UpdatedDate DATE      NOT NULL,
    CONSTRAINT PK_Contain                 PRIMARY KEY (CHouseID, CcategoryID),
    CONSTRAINT FK_Contain_House           FOREIGN KEY (CHouseID)    REFERENCES House (HouseID),
    CONSTRAINT FK_Contain_HouseCategory   FOREIGN KEY (CcategoryID) REFERENCES HouseCategory (categoryID)
);

CREATE TABLE RequestViewing (
    VCustomerID  CHAR(10)  NOT NULL,
    VHouseID     CHAR(11)  NOT NULL,
    RequestDate  DATE      NOT NULL,
    CONSTRAINT PK_RequestViewing          PRIMARY KEY (VCustomerID, VHouseID),
    CONSTRAINT FK_RequestViewing_Customer FOREIGN KEY (VCustomerID) REFERENCES Customer (CustomerID),
    CONSTRAINT FK_RequestViewing_House    FOREIGN KEY (VHouseID)    REFERENCES House (HouseID)
);


-- SEED DATA


-- 1. HouseCategory (10 entries)

INSERT INTO HouseCategory (categoryID, CategoryName, description, createdDate) VALUES
('CAT00001', 'Villa',        'Luxury standalone villas with private gardens and pools',          '2022-01-01'),
('CAT00002', 'Condo',        'Modern condominiums in urban high-rise buildings',                 '2022-01-01'),
('CAT00003', 'Townhouse',    'Multi-floor townhouses in gated residential communities',          '2022-03-15'),
('CAT00004', 'Mansion',      'Grand mansions with extensive land and premium facilities',        '2022-03-15'),
('CAT00005', 'Bungalow',     'Single-story homes ideal for small families and retirees',        '2022-06-01'),
('CAT00006', 'Penthouse',    'Top-floor luxury units with panoramic city or sea views',         '2022-06-01'),
('CAT00007', 'Studio',       'Compact studio units ideal for singles or young professionals',   '2022-08-20'),
('CAT00008', 'Duplex',       'Two-story units sharing a common wall, great value for families', '2022-08-20'),
('CAT00009', 'Shophouse',    'Mixed-use properties with commercial ground floor and residence', '2023-01-10'),
('CAT00010', 'Resort Home',  'Holiday-style homes located in resort or beachside estates',      '2023-01-10');


-- 2. Area (10 entries)

INSERT INTO Area (AreaName, Province, District, Subdistrict, Zipcode) VALUES
('Sukhumvit',       'Bangkok',               'Watthana',          'Khlong Toei Nuea',   '10110'),
('Nimman',          'Chiang Mai',            'Mueang Chiang Mai', 'Su Thep',            '50200'),
('Patong',          'Phuket',               'Kathu',             'Patong',             '83150'),
('Hua Hin Center',  'Prachuap Khiri Khan',  'Hua Hin',           'Hua Hin',            '77110'),
('Thonglor',        'Bangkok',               'Watthana',          'Khlong Tan Nuea',    '10110'),
('Silom',           'Bangkok',               'Bang Rak',          'Silom',              '10500'),
('Kata Beach',      'Phuket',               'Mueang Phuket',     'Karon',              '83100'),
('Santitham',       'Chiang Mai',            'Mueang Chiang Mai', 'Chang Phueak',       '50300'),
('Pattaya Beach',   'Chonburi',             'Bang Lamung',       'Nong Prue',          '20150'),
('Samui Chaweng',   'Surat Thani',          'Ko Samui',          'Bo Phut',            '84320'),
('Salaya',          'Nakhon Pathom',        'Phutthamonthon',    'Salaya',             '73170');


-- 3. House (10 entries)

INSERT INTO House (
    HouseID, HouseName,
    bedroomCount, bathroomCount, basementCount,
    Description, HcategoryID, HAreaName,
    BuyingStatus, RentingStatus,
    BuyingPrice, RentingPrice
) VALUES
(
    'H0000000001', 'Sukhumvit Luxury Villa',
    4, 3, 1,
    'A stunning luxury villa in the heart of Sukhumvit. Private pool, spacious garden, modern interior. Walking distance to BTS and premium malls.',
    'CAT00001', 'Sukhumvit',
    TRUE, TRUE, 15000000.00, 85000.00
),
(
    'H0000000002', 'Nimman Modern Condo',
    2, 2, 0,
    'Contemporary condo in trendy Nimman, Chiang Mai. Close to One Nimman plaza and CMU. Fully furnished with mountain views.',
    'CAT00002', 'Nimman',
    TRUE, TRUE, 4500000.00, 22000.00
),
(
    'H0000000003', 'Patong Beachfront Mansion',
    6, 5, 1,
    'Magnificent beachfront mansion in Patong, Phuket. Infinity pool, home cinema, gym, and panoramic sea views.',
    'CAT00004', 'Patong',
    TRUE, FALSE, 45000000.00, 0.00
),
(
    'H0000000004', 'Hua Hin Garden Bungalow',
    3, 2, 0,
    'Charming single-story bungalow in a quiet garden estate near Hua Hin beach. Perfect for retirees or small families.',
    'CAT00005', 'Hua Hin Center',
    TRUE, TRUE, 6800000.00, 35000.00
),
(
    'H0000000005', 'Thonglor Premium Townhouse',
    3, 3, 1,
    'Elegant 3-storey townhouse in upscale Thonglor. Rooftop terrace, smart home system, private parking.',
    'CAT00003', 'Thonglor',
    FALSE, TRUE, 0.00, 65000.00
),
(
    'H0000000006', 'Silom Sky Penthouse',
    3, 3, 0,
    'Breathtaking top-floor penthouse in Silom CBD. Floor-to-ceiling windows, private jacuzzi, and wraparound city skyline views.',
    'CAT00006', 'Silom',
    TRUE, TRUE, 28000000.00, 150000.00
),
(
    'H0000000007', 'Kata Beach Resort Home',
    5, 4, 0,
    'Beautiful resort-style home steps from Kata Beach. Private tropical garden, sala pavilion, and direct beach access.',
    'CAT00010', 'Kata Beach',
    TRUE, TRUE, 22000000.00, 120000.00
),
(
    'H0000000008', 'Santitham Studio Condo',
    1, 1, 0,
    'Cozy and affordable studio unit in Santitham, Chiang Mai. Ideal for digital nomads. Near Night Bazaar and city center.',
    'CAT00007', 'Santitham',
    TRUE, TRUE, 1200000.00, 8000.00
),
(
    'H0000000009', 'Pattaya Sea View Duplex',
    4, 3, 0,
    'Spacious duplex with stunning Gulf of Thailand views in Pattaya. Modern kitchen, open-plan living, rooftop lounge.',
    'CAT00008', 'Pattaya Beach',
    TRUE, TRUE, 9500000.00, 48000.00
),
(
    'H0000000010', 'Samui Chaweng Shophouse',
    2, 2, 0,
    'Versatile shophouse on Chaweng main road, Koh Samui. Ground floor commercial space with 2-bedroom residence above.',
    'CAT00009', 'Samui Chaweng',
    TRUE, FALSE, 7500000.00, 0.00
);


-- 4. Photo (10 entries — 1 per house)

INSERT INTO Photo (PhotoID, Pdescription, PhotoRef, PHouseID) VALUES
('PH000001', 'Front exterior view',         'https://images.unsplash.com/photo-1613490493576-7fde63acd811', 'H0000000001'),
('PH000002', 'Condo living room',           'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'H0000000002'),
('PH000003', 'Beachfront facade',           'https://images.unsplash.com/photo-1580587771525-78b9dba3b914', 'H0000000003'),
('PH000004', 'Garden and front porch',      'https://images.unsplash.com/photo-1570129477492-45c003edd2be', 'H0000000004'),
('PH000005', 'Rooftop terrace view',        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 'H0000000005'),
('PH000006', 'Penthouse city skyline',      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'H0000000006'),
('PH000007', 'Resort garden pool',          'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 'H0000000007'),
('PH000008', 'Studio interior',             'https://images.unsplash.com/photo-1560448204-603b3fc33ddc', 'H0000000008'),
('PH000009', 'Duplex sea view balcony',     'https://images.unsplash.com/photo-1484101403633-562f891dc89a', 'H0000000009'),
('PH000010', 'Shophouse street front',      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136', 'H0000000010');


-- 5. Customer (10 entries)

INSERT INTO Customer (CustomerID, CName, CustomerGmail, CustomerPhoneNumber) VALUES
('C000000001', 'Somchai Jaidee',       'somchai.j@gmail.com',    '0812345671'),
('C000000002', 'Nittaya Suksai',       'nittaya.s@gmail.com',    '0823456782'),
('C000000003', 'Pravit Moonthong',     'pravit.m@gmail.com',     '0834567893'),
('C000000004', 'Wilaiporn Khamthong',  'wilaiporn.k@gmail.com',  '0845678904'),
('C000000005', 'Thanakorn Rattana',    'thanakorn.r@gmail.com',  '0856789015'),
('C000000006', 'Anchisa Duangjai',     'anchisa.d@gmail.com',    '0867890126'),
('C000000007', 'Krit Sombat',          'krit.s@gmail.com',       '0878901237'),
('C000000008', 'Malee Charoenwong',    'malee.c@gmail.com',      '0889012348'),
('C000000009', 'Pongsakorn Thavorn',   'pongsakorn.t@gmail.com', '0890123459'),
('C000000010', 'Saowanee Phromma',     'saowanee.p@gmail.com',   '0801234560');


-- 6. Admin (10 entries)

INSERT INTO Admin (AdminID, Aname, AdminGmail, AdminPhoneNumber, Salary, Password) VALUES
('A000000001', 'Natthapat Siripong',   'natthapat.s@longgone.com',  '0811111111', 55000.00, 'admin1234'),
('A000000002', 'Chalida Wongrat',      'chalida.w@longgone.com',    '0822222222', 52000.00, 'chalida456'),
('A000000003', 'Ekachai Buranasiri',   'ekachai.b@longgone.com',    '0833333333', 60000.00, 'ekachai789'),
('A000000004', 'Pimchanok Lertwong',   'pimchanok.l@longgone.com',  '0844444444', 58000.00, 'pimcha321'),
('A000000005', 'Thanadol Kongkaew',    'thanadol.k@longgone.com',   '0855555555', 53000.00, 'thanadol654'),
('A000000006', 'Supansa Klinhom',      'supansa.k@longgone.com',    '0866666666', 57000.00, 'supansa987'),
('A000000007', 'Wirachat Saelee',      'wirachat.s@longgone.com',   '0877777777', 61000.00, 'wirachat111'),
('A000000008', 'Monthida Phansri',     'monthida.p@longgone.com',   '0888888888', 54000.00, 'monthida222'),
('A000000009', 'Kittipong Mahawan',    'kittipong.m@longgone.com',  '0899999999', 56000.00, 'kittip333'),
('A000000010', 'Rattana Chaiyo',       'rattana.c@longgone.com',    '0810000000', 59000.00, 'rattana444');


-- 7. AdminAccount (10 entries)

INSERT INTO AdminAccount (AdminAccID, AdminAccName, AdminAccGmail, AdminAccPhoneNumber, ACAdminID) VALUES
('AC00000001', 'Natthapat Account',  'acc.natthapat@longgone.com',  '0811111112', 'A000000001'),
('AC00000002', 'Chalida Account',    'acc.chalida@longgone.com',    '0822222223', 'A000000002'),
('AC00000003', 'Ekachai Account',    'acc.ekachai@longgone.com',    '0833333334', 'A000000003'),
('AC00000004', 'Pimchanok Account',  'acc.pimchanok@longgone.com',  '0844444445', 'A000000004'),
('AC00000005', 'Thanadol Account',   'acc.thanadol@longgone.com',   '0855555556', 'A000000005'),
('AC00000006', 'Supansa Account',    'acc.supansa@longgone.com',    '0866666667', 'A000000006'),
('AC00000007', 'Wirachat Account',   'acc.wirachat@longgone.com',   '0877777778', 'A000000007'),
('AC00000008', 'Monthida Account',   'acc.monthida@longgone.com',   '0888888889', 'A000000008'),
('AC00000009', 'Kittipong Account',  'acc.kittipong@longgone.com',  '0899999990', 'A000000009'),
('AC00000010', 'Rattana Account',    'acc.rattana@longgone.com',    '0810000001', 'A000000010');


-- 8. HouseBroker (10 entries)

INSERT INTO HouseBroker (HBID, HBname, HBPhoneNumber, HBGmail, Wage, HBAdminID) VALUES
('HB000000001', 'Somporn Jitburi',      '0811112222', 'somporn.j@longgone.com',   35000.00, 'A000000001'),
('HB000000002', 'Ladawan Phetrak',      '0822223333', 'ladawan.p@longgone.com',   33000.00, 'A000000002'),
('HB000000003', 'Anek Srisuk',          '0833334444', 'anek.s@longgone.com',      36000.00, 'A000000003'),
('HB000000004', 'Patcharee Yodrak',     '0844445555', 'patcharee.y@longgone.com', 34000.00, 'A000000004'),
('HB000000005', 'Chaiyanat Meepan',     '0855556666', 'chaiyanat.m@longgone.com', 37000.00, 'A000000005'),
('HB000000006', 'Nootchanok Thongdee',  '0866667777', 'nootchanok.t@longgone.com',32000.00, 'A000000006'),
('HB000000007', 'Pakpoom Suwan',        '0877778888', 'pakpoom.s@longgone.com',   38000.00, 'A000000007'),
('HB000000008', 'Siriporn Malakam',     '0888889999', 'siriporn.m@longgone.com',  33500.00, 'A000000008'),
('HB000000009', 'Watchara Nilphan',     '0899990000', 'watchara.n@longgone.com',  36500.00, 'A000000009'),
('HB000000010', 'Pornpimol Kaewkla',    '0810001111', 'pornpimol.k@longgone.com', 34500.00, 'A000000010');


-- 9. Rating (10 entries — unique RCustomerID + RHouseID pairs)

INSERT INTO Rating (RCustomerID, RHouseID, RatingValue, Date) VALUES
('C000000001', 'H0000000001', 4.50, '2024-01-15'),
('C000000002', 'H0000000002', 3.75, '2024-02-10'),
('C000000003', 'H0000000003', 5.00, '2024-02-28'),
('C000000004', 'H0000000004', 4.00, '2024-03-05'),
('C000000005', 'H0000000005', 4.25, '2024-03-20'),
('C000000006', 'H0000000006', 4.75, '2024-04-01'),
('C000000007', 'H0000000007', 5.00, '2024-04-15'),
('C000000008', 'H0000000008', 3.50, '2024-05-02'),
('C000000009', 'H0000000009', 4.00, '2024-05-18'),
('C000000010', 'H0000000010', 3.25, '2024-06-01');


-- 10. Manage (10 entries — unique MAdminAccID + MHouseID pairs)

INSERT INTO Manage (MAdminAccID, MHouseID, UpdateDate, UpdateType) VALUES
('AC00000001', 'H0000000001', '2024-01-01', 'ADD'),
('AC00000002', 'H0000000002', '2024-01-05', 'ADD'),
('AC00000003', 'H0000000003', '2024-01-10', 'ADD'),
('AC00000004', 'H0000000004', '2024-01-15', 'ADD'),
('AC00000005', 'H0000000005', '2024-01-20', 'ADD'),
('AC00000006', 'H0000000006', '2024-02-01', 'UPDATE'),
('AC00000007', 'H0000000007', '2024-02-10', 'UPDATE'),
('AC00000008', 'H0000000008', '2024-03-01', 'ADD'),
('AC00000009', 'H0000000009', '2024-03-15', 'UPDATE'),
('AC00000010', 'H0000000010', '2024-04-01', 'ADD');


-- 11. Contain (10 entries — unique CHouseID + CcategoryID pairs)

INSERT INTO Contain (CHouseID, CcategoryID, UpdatedDate) VALUES
('H0000000001', 'CAT00001', '2024-01-01'),
('H0000000002', 'CAT00002', '2024-01-05'),
('H0000000003', 'CAT00004', '2024-01-10'),
('H0000000004', 'CAT00005', '2024-01-15'),
('H0000000005', 'CAT00003', '2024-01-20'),
('H0000000006', 'CAT00006', '2024-02-01'),
('H0000000007', 'CAT00010', '2024-02-10'),
('H0000000008', 'CAT00007', '2024-03-01'),
('H0000000009', 'CAT00008', '2024-03-15'),
('H0000000010', 'CAT00009', '2024-04-01');


-- 12. RequestViewing (10 entries — unique VCustomerID + VHouseID pairs)

INSERT INTO RequestViewing (VCustomerID, VHouseID, RequestDate) VALUES
('C000000001', 'H0000000002', '2024-02-01'),
('C000000002', 'H0000000003', '2024-02-05'),
('C000000003', 'H0000000004', '2024-02-10'),
('C000000004', 'H0000000005', '2024-02-15'),
('C000000005', 'H0000000006', '2024-03-01'),
('C000000006', 'H0000000007', '2024-03-10'),
('C000000007', 'H0000000008', '2024-03-20'),
('C000000008', 'H0000000009', '2024-04-01'),
('C000000009', 'H0000000010', '2024-04-10'),
('C000000010', 'H0000000001', '2024-04-20');
