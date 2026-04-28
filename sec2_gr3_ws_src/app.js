const express = require("express")
const mysql = require("mysql2")
const path = require('path')
const fs = require('fs')
const dotenv = require("dotenv")
dotenv.config()

let dbConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

dbConn.connect(function (err) {
  if (err) throw err;
  console.log(`Connected DB: ${process.env.DB_NAME}`)
})

const app = express()
var cors = require('cors');
app.use(cors());
const router = express.Router()
app.use(router)
router.use(express.json({ limit: '50mb' }))
router.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))


// ------------------------------------------------------------
// 1. SEARCH SERVICE
//    GET /houses/search?category=&rating=&location=&type=
//    - category : HouseCategory.CategoryName  (optional)
//    - rating   : minimum average rating value (optional)
//    - location : partial match on Area fields (optional)
//    - type     : 'buy' | 'rent'              (optional)
//    Test case 1: GET /houses/search?category=Mansion&location=Bangkok
//    Test case 2: GET /houses/search?rating=4&location=Chiang
//    Test case 3: GET /houses/search?type=rent
// ------------------------------------------------------------
router.get('/houses/search', function (req, res) {
  const { category, rating, location, type } = req.query

  let sql = `
    SELECT
      h.HouseID, h.HouseName,
      h.bedroomCount, h.bathroomCount, h.basementCount,
      h.Description, h.HAreaName,
      h.BuyingStatus, h.RentingStatus,
      h.BuyingPrice, h.RentingPrice,
      hc.CategoryName,
      a.Province, a.District, a.Subdistrict, a.Zipcode,
      AVG(r.RatingValue)            AS avgRating,
      COUNT(DISTINCT r.RCustomerID) AS ratingCount,
      JSON_ARRAYAGG(
        IF(p.PhotoID IS NOT NULL,
           JSON_OBJECT('PhotoID', p.PhotoID, 'PhotoRef', p.PhotoRef, 'Pdescription', p.Pdescription),
           NULL)
      ) AS photos
    FROM House h
    LEFT JOIN HouseCategory hc ON h.HcategoryID = hc.categoryID
    LEFT JOIN Area a           ON h.HAreaName   = a.AreaName
    LEFT JOIN Rating r         ON h.HouseID     = r.RHouseID
    LEFT JOIN Photo p          ON h.HouseID     = p.PHouseID
    WHERE 1=1
  `
  const params = []

  if (category) {
    sql += ` AND hc.CategoryName = ?`
    params.push(category)
  }

  if (location) {
    sql += ` AND (
      a.AreaName    LIKE ? OR
      a.Province    LIKE ? OR
      a.District    LIKE ? OR
      a.Subdistrict LIKE ? OR
      a.Zipcode     LIKE ?
    )`
    const like = `%${location}%`
    params.push(like, like, like, like, like)
  }

  if (type === 'buy') {
    sql += ` AND h.BuyingStatus = TRUE`
  } else if (type === 'rent') {
    sql += ` AND h.RentingStatus = TRUE`
  }

  sql += `
    GROUP BY
      h.HouseID, h.HouseName, h.bedroomCount, h.bathroomCount,
      h.basementCount, h.Description, h.HAreaName,
      h.BuyingStatus, h.RentingStatus, h.BuyingPrice, h.RentingPrice,
      hc.CategoryName, a.Province, a.District, a.Subdistrict, a.Zipcode
  `

  if (rating) {
    sql += ` HAVING ROUND(avgRating) = ?`
    params.push(parseFloat(rating))
  }

  dbConn.query(sql, params, function (err, results) {
    if (err) return res.status(500).json({ error: err.message })

    const data = results.map(row => ({
      ...row,
      photos: (row.photos || []).filter(p => p !== null)
    }))

    res.json({ count: data.length, data })
  })
})

// ------------------------------------------------------------
// 2. INSERT HOUSE (Admin only)
//    POST /houses
//    Body: { HouseID, HouseName, bedroomCount, bathroomCount,
//            basementCount, Description, HcategoryID, HAreaName,
//            BuyingStatus, RentingStatus, BuyingPrice, RentingPrice }
//    Test case 1: POST /houses  with all required fields → 201
//    Test case 2: POST /houses  missing HouseID          → 400
// ------------------------------------------------------------
router.post('/houses', function (req, res) {
  const {
    HouseID, HouseName,
    bedroomCount, bathroomCount, basementCount,
    Description, HcategoryID, HAreaName,
    BuyingStatus, RentingStatus,
    BuyingPrice, RentingPrice
  } = req.body

  if (
    !HouseID || !HouseName ||
    bedroomCount === undefined || bathroomCount === undefined || basementCount === undefined ||
    !HcategoryID || !HAreaName ||
    BuyingStatus === undefined || RentingStatus === undefined ||
    BuyingPrice === undefined || RentingPrice === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  const sql = `
    INSERT INTO House
      (HouseID, HouseName, bedroomCount, bathroomCount, basementCount,
       Description, HcategoryID, HAreaName,
       BuyingStatus, RentingStatus, BuyingPrice, RentingPrice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const params = [
    HouseID, HouseName,
    bedroomCount, bathroomCount, basementCount,
    Description || null, HcategoryID, HAreaName,
    BuyingStatus, RentingStatus,
    BuyingPrice, RentingPrice
  ]

  dbConn.query(sql, params, function (err, result) {
    if (err) return res.status(500).json({ error: err.message })
    res.status(201).json({ message: 'House inserted successfully.', HouseID })
  })
})

// ------------------------------------------------------------
// 3. UPDATE HOUSE (Admin only)
//    PUT /houses/:id
//    Body: any subset of { HouseName, bedroomCount, bathroomCount,
//          basementCount, Description, HcategoryID, HAreaName,
//          BuyingStatus, RentingStatus, BuyingPrice, RentingPrice }
//    Test case 1: PUT /houses/H0000000001 { BuyingPrice: 3500000 } → 200
//    Test case 2: PUT /houses/NOTEXIST    { HouseName: "X" }       → 404
// ------------------------------------------------------------
router.put('/houses/:id', function (req, res) {
  const { id } = req.params
  const fields = req.body
  const allowed = [
    'HouseName', 'bedroomCount', 'bathroomCount', 'basementCount',
    'Description', 'HcategoryID', 'HAreaName',
    'BuyingStatus', 'RentingStatus', 'BuyingPrice', 'RentingPrice'
  ]

  const updates = []
  const params = []

  allowed.forEach(field => {
    if (fields[field] !== undefined) {
      updates.push(`${field} = ?`)
      params.push(fields[field])
    }
  })

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update.' })
  }

  params.push(id)
  const sql = `UPDATE House SET ${updates.join(', ')} WHERE HouseID = ?`

  dbConn.query(sql, params, function (err, result) {
    if (err) return res.status(500).json({ error: err.message })
    if (result.affectedRows === 0)
      return res.status(404).json({ error: `House '${id}' not found.` })
    res.json({ message: 'House updated successfully.', HouseID: id })
  })
})

// ------------------------------------------------------------
// 4. DELETE HOUSE (Admin only)
//    DELETE /houses/:id
//    Test case 1: DELETE /houses/H0000000001  → 200
//    Test case 2: DELETE /houses/NOTEXIST     → 404
// ------------------------------------------------------------
router.delete('/houses/:id', function (req, res) {
  const { id } = req.params

  // First check if house exists
  dbConn.query('SELECT HouseID FROM House WHERE HouseID = ?', [id], function (err, results) {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.status(404).json({ error: `House '${id}' not found.` })

    // Begin transaction — delete all child records first, then the house
    dbConn.beginTransaction(function (err) {
      if (err) return res.status(500).json({ error: err.message })

      const deleteChildren = [
        'DELETE FROM RequestViewing WHERE VHouseID = ?',
        'DELETE FROM Contain       WHERE CHouseID  = ?',
        'DELETE FROM Manage        WHERE MHouseID  = ?',
        'DELETE FROM Rating        WHERE RHouseID  = ?',
        'DELETE FROM Photo         WHERE PHouseID  = ?',
      ]

      // Run each child delete sequentially
      let index = 0
      function next() {
        if (index === deleteChildren.length) {
          // All children deleted — now delete the house
          dbConn.query('DELETE FROM House WHERE HouseID = ?', [id], function (err) {
            if (err) return dbConn.rollback(() =>
              res.status(500).json({ error: err.message }))

            dbConn.commit(function (err) {
              if (err) return dbConn.rollback(() =>
                res.status(500).json({ error: err.message }))

              res.json({ message: 'House deleted successfully.', HouseID: id })
            })
          })
          return
        }

        dbConn.query(deleteChildren[index++], [id], function (err) {
          if (err) return dbConn.rollback(() =>
            res.status(500).json({ error: err.message }))
          next()
        })
      }

      next()
    })
  })
})

// ------------------------------------------------------------
// 5. ADMIN LOGIN
//    POST /admin/login
//    Body: { AdminID, Password }
//    Test case 1: POST /admin/login  correct credentials → 200 + admin info
//    Test case 2: POST /admin/login  wrong password      → 401
// ------------------------------------------------------------
router.post('/admin/login', function (req, res) {
  const { AdminID, Password } = req.body

  if (!AdminID || !Password) {
    return res.status(400).json({ error: 'AdminID and Password are required.' })
  }

  const sql = `SELECT AdminID, Aname, AdminGmail, AdminPhoneNumber, Salary, Password
               FROM Admin WHERE AdminID = ?`

  dbConn.query(sql, [AdminID], function (err, results) {
    if (err) return res.status(500).json({ error: err.message })

    if (results.length === 0)
      return res.status(401).json({ error: 'Invalid AdminID or password.' })

    const admin = results[0]

    if (Password !== admin.Password)
      return res.status(401).json({ error: 'Invalid AdminID or password.' })

    // Return admin info (exclude password)
    const { Password: _, ...adminInfo } = admin
    res.json({ message: 'Login successful.', admin: adminInfo })
  })
})

// ------------------------------------------------------------
// 6. GET ALL HOUSES
//    GET /houses
//    - Returns all houses with category name, area info,
//      avg rating, and photos
//    Test case 1: GET /houses            → 200 + array of all houses
//    Test case 2: GET /houses (empty DB) → 200 + empty array
// ------------------------------------------------------------
router.get('/houses', function (req, res) {
  const sql = `
    SELECT
      h.HouseID,
      h.HouseName,
      h.bedroomCount,
      h.bathroomCount,
      h.basementCount,
      h.Description,
      h.HAreaName,
      h.BuyingStatus,
      h.RentingStatus,
      h.BuyingPrice,
      h.RentingPrice,
      hc.CategoryName,
      a.Province,
      a.District,
      a.Subdistrict,
      a.Zipcode,
      AVG(r.RatingValue)            AS avgRating,
      COUNT(DISTINCT r.RCustomerID) AS ratingCount,
      JSON_ARRAYAGG(
        IF(p.PhotoID IS NOT NULL,
           JSON_OBJECT('PhotoID', p.PhotoID, 'PhotoRef', p.PhotoRef, 'Pdescription', p.Pdescription),
           NULL)
      ) AS photos
    FROM House h
    LEFT JOIN HouseCategory hc ON h.HcategoryID = hc.categoryID
    LEFT JOIN Area a           ON h.HAreaName   = a.AreaName
    LEFT JOIN Rating r         ON h.HouseID     = r.RHouseID
    LEFT JOIN Photo p          ON h.HouseID     = p.PHouseID
    GROUP BY
      h.HouseID, h.HouseName, h.bedroomCount, h.bathroomCount,
      h.basementCount, h.Description, h.HAreaName,
      h.BuyingStatus, h.RentingStatus, h.BuyingPrice, h.RentingPrice,
      hc.CategoryName, a.Province, a.District, a.Subdistrict, a.Zipcode
    ORDER BY h.HouseID
  `

  dbConn.query(sql, function (err, results) {
    if (err) return res.status(500).json({ error: err.message })

    // Clean up photos: remove nulls from JSON_ARRAYAGG
    const data = results.map(row => ({
      ...row,
      photos: (row.photos || []).filter(p => p !== null)
    }))

    res.json({ count: data.length, data })
  })
})

// ------------------------------------------------------------
// 7. GET HOUSE BY ID
//    GET /houses/:id
//    Test case 1: GET /houses/H0000000001  → 200 + house data
//    Test case 2: GET /houses/NOTEXIST     → 404
// ------------------------------------------------------------
router.get('/houses/:id', function (req, res) {
  const { id } = req.params

  const sql = `
    SELECT
      h.HouseID,
      h.HouseName,
      h.bedroomCount,
      h.bathroomCount,
      h.basementCount,
      h.Description,
      h.HAreaName,
      h.BuyingStatus,
      h.RentingStatus,
      h.BuyingPrice,
      h.RentingPrice,
      hc.CategoryName,
      a.Province,
      a.District,
      a.Subdistrict,
      a.Zipcode,
      AVG(r.RatingValue)            AS avgRating,
      COUNT(DISTINCT r.RCustomerID) AS ratingCount,
      JSON_ARRAYAGG(
        IF(p.PhotoID IS NOT NULL,
           JSON_OBJECT('PhotoID', p.PhotoID, 'PhotoRef', p.PhotoRef, 'Pdescription', p.Pdescription),
           NULL)
      ) AS photos
    FROM House h
    LEFT JOIN HouseCategory hc ON h.HcategoryID = hc.categoryID
    LEFT JOIN Area a           ON h.HAreaName   = a.AreaName
    LEFT JOIN Rating r         ON h.HouseID     = r.RHouseID
    LEFT JOIN Photo p          ON h.HouseID     = p.PHouseID
    WHERE h.HouseID = ?
    GROUP BY
      h.HouseID, h.HouseName, h.bedroomCount, h.bathroomCount,
      h.basementCount, h.Description, h.HAreaName,
      h.BuyingStatus, h.RentingStatus, h.BuyingPrice, h.RentingPrice,
      hc.CategoryName, a.Province, a.District, a.Subdistrict, a.Zipcode
  `

  dbConn.query(sql, [id], function (err, results) {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0)
      return res.status(404).json({ error: `House '${id}' not found.` })

    const house = {
      ...results[0],
      photos: (results[0].photos || []).filter(p => p !== null)
    }

    res.json({ data: house })
  })
})

// ------------------------------------------------------------
// 8. REQUEST VIEWING
//    POST /request-viewing
//    Body: { VCustomerID, VHouseID, RequestDate }
//    Test case 1: valid IDs + date → 201
//    Test case 2: missing field   → 400
// ------------------------------------------------------------
router.post('/request-viewing', function (req, res) {
  const { VCustomerID, VHouseID, RequestDate } = req.body

  if (!VCustomerID || !VHouseID || !RequestDate) {
    return res.status(400).json({ error: 'VCustomerID, VHouseID, and RequestDate are required.' })
  }

  // Check customer exists; if not, create a guest entry so the FK doesn't fail
  const checkCustomer = `SELECT CustomerID FROM Customer WHERE CustomerID = ?`
  dbConn.query(checkCustomer, [VCustomerID], function (err, rows) {
    if (err) return res.status(500).json({ error: err.message })

    function insertRequest () {
      const sql = `
        INSERT INTO RequestViewing (VCustomerID, VHouseID, RequestDate)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE RequestDate = VALUES(RequestDate)
      `
      dbConn.query(sql, [VCustomerID, VHouseID, RequestDate], function (err) {
        if (err) return res.status(500).json({ error: err.message })
        res.status(201).json({
          message: 'Viewing request submitted successfully.',
          VCustomerID, VHouseID, RequestDate
        })
      })
    }

    if (rows.length === 0) {
      // Insert a minimal guest customer so the FK is satisfied
      const guestSql = `
        INSERT IGNORE INTO Customer (CustomerID, CName, CustomerGmail, CustomerPhoneNumber)
        VALUES (?, 'Guest', 'guest@longgone.com', '0000000000')
      `
      dbConn.query(guestSql, [VCustomerID], function (err) {
        if (err) return res.status(500).json({ error: err.message })
        insertRequest()
      })
    } else {
      insertRequest()
    }
  })
})

// ------------------------------------------------------------
// 9. FORCE UPDATE RATING (Admin)
//    POST /rating
//    Body: { RHouseID, RatingValue }
// ------------------------------------------------------------
router.post('/rating', function (req, res) {
  const { RHouseID, RatingValue } = req.body;
  if (!RHouseID || RatingValue === undefined) {
    return res.status(400).json({ error: 'RHouseID and RatingValue are required.' });
  }

  const adminCustID = 'C000000000';

  // 1. Ensure the system customer exists
  const guestSql = `
    INSERT IGNORE INTO Customer (CustomerID, CName, CustomerGmail, CustomerPhoneNumber)
    VALUES (?, 'System Admin', 'admin@longgone.com', '0000000000')
  `;
  
  dbConn.query(guestSql, [adminCustID], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // 2. Delete existing ratings for this house so the new average is exactly what the admin wants
    dbConn.query('DELETE FROM Rating WHERE RHouseID = ?', [RHouseID], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Insert the single new rating
      const insertSql = `
        INSERT INTO Rating (RCustomerID, RHouseID, RatingValue, Date)
        VALUES (?, ?, ?, CURDATE())
      `;
      dbConn.query(insertSql, [adminCustID, RHouseID, RatingValue], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Rating updated successfully.' });
      });
    });
  });
});

// ------------------------------------------------------------
// 10. UPLOAD PHOTOS (Admin)
//     POST /houses/:id/photos
//     Body: { photos: [ "data:image/png;base64,...", ... ] }
// ------------------------------------------------------------
router.post('/houses/:id/photos', function (req, res) {
  const { id } = req.params;
  const { photos } = req.body;

  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: 'Photos must be an array of base64 strings.' });
  }

  // First, verify house exists
  dbConn.query('SELECT HouseID FROM House WHERE HouseID = ?', [id], function (err, results) {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: `House '${id}' not found.` });

    dbConn.beginTransaction(function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Delete existing photos for this house from DB
      dbConn.query('DELETE FROM Photo WHERE PHouseID = ?', [id], function (err) {
        if (err) return dbConn.rollback(() => res.status(500).json({ error: err.message }));

        let insertQueries = [];
        let paramsList = [];
        let keptFilenames = [];
        
        photos.forEach((base64String, index) => {
          if (!base64String) return;
          
          // Match data:image/png;base64,.....
          const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            // It might already be a URL
            insertQueries.push('(?, NULL, ?, ?)');
            const photoIdUrl = `P${Date.now().toString().slice(-6)}${index}`.padEnd(8, '0').substring(0, 8);
            paramsList.push(photoIdUrl, base64String, id);
            
            const urlParts = base64String.split('/');
            keptFilenames.push(urlParts[urlParts.length - 1]);
            return;
          }

          const imageBuffer = Buffer.from(matches[2], 'base64');
          const ext = matches[1].split('/')[1] || 'png';
          const filename = `${id}_${Date.now()}_${index}.${ext}`;
          const folderPath = path.join(__dirname, 'public/uploads', id);
          const filepath = path.join(folderPath, filename);
          
          try {
            if (!fs.existsSync(folderPath)) {
               fs.mkdirSync(folderPath, { recursive: true });
            }
            fs.writeFileSync(filepath, imageBuffer);
            const photoUrl = `http://localhost:3000/uploads/${id}/${filename}`;
            insertQueries.push('(?, NULL, ?, ?)');
            
            // PhotoID must be unique CHAR(8), e.g. padding
            // We use 'P' + 5 random digits or something similar. Let's just use a timestamp based slice
            const photoId = `P${Date.now().toString().slice(-5)}${index}`.padEnd(8, '0');
            paramsList.push(photoId.substring(0, 8), photoUrl, id);
            keptFilenames.push(filename);
          } catch (e) {
            console.error('Error writing file:', e);
          }
        });

        // Cleanup old files in the directory
        const folderPath = path.join(__dirname, 'public/uploads', id);
        if (fs.existsSync(folderPath)) {
          try {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
              if (!keptFilenames.includes(file)) {
                fs.unlinkSync(path.join(folderPath, file));
              }
            });
          } catch (e) {
            console.error('Error cleaning up files:', e);
          }
        }

        if (insertQueries.length === 0) {
          return dbConn.commit(function (err) {
            if (err) return dbConn.rollback(() => res.status(500).json({ error: err.message }));
            res.status(200).json({ message: 'All photos removed and old files cleaned.' });
          });
        }

        const insertSql = `INSERT INTO Photo (PhotoID, Pdescription, PhotoRef, PHouseID) VALUES ${insertQueries.join(',')}`;
        dbConn.query(insertSql, paramsList, function (err) {
          if (err) return dbConn.rollback(() => res.status(500).json({ error: err.message }));
          dbConn.commit(function (err) {
            if (err) return dbConn.rollback(() => res.status(500).json({ error: err.message }));
            res.status(200).json({ message: 'Photos updated successfully.' });
          });
        });
      });
    });
  });
});

app.listen(process.env.PORT, function () {
  console.log(`Server listening on port: ${process.env.PORT}`)
})

