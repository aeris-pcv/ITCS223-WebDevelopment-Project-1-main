# Long Gone — Haunted House

## Requirements

**Node.js**,
**MySQL**,
**npm**,
**Modern browser**,
**Postman**

1. Change the environment file named `.env` with your MySQL information

2. ### Install back-end dependencies

```bash
# inside sec2_gr3_ws_src/
npm install
```

```bash
# inside sec2_gr3_fe_src/
npm install
```

Packages installed.
---

3. ### Start the back-end web service

```bash
cd ../sec2_gr3_ws_src
npm start
```

Expected console output:

```
Connected DB: long_gone_db
Server listening on port: 3000
```

The API is now available at **`http://localhost:3000`**.

---

4. ### Start the front-end server

Open a **new terminal**, go to the front-end folder, and start a static file server:

```bash
cd ../sec2_gr3_fe_src
npm start
```

```
Long Gone front-end server running at <http://localhost:8080>
Homepage → <http://localhost:8080/html/homepage>
Dashboard → <http://localhost:8080/dashboard>

```
## How to Access the Application

With both servers running, open your browser:

| Homepage | <http://localhost:8080/homepage> |

| Buy listings | <http://localhost:8080/buy_search> |

| Rent listings | <http://localhost:8080/renting_search> |

| Team page | <http://localhost:8080/team_page> |

| Admin login | <http://localhost:8080/log_in> |

| Admin dashboard | <http://localhost:8080/dashboard> *(redirects if not logged in)* |

**Admin credentials** use `AdminID` and `Password` from the `Admin` table in `long_gone_db`. Use the `POST /admin/login` endpoint (see Web Services section below).

Example credentials:

| AdminID | Password |
| `A000000001` | `admin1234` |

---

## Features

### Public (no login required)

- **Homepage** — hero with haunted-house background image, 4-criteria search bar (intent / category / rating / location), auto-rotating featured-houses **carousel** (prev/next + dot indicators), and three-card "Why Long Gone?" section.
- **Buy / Rent pages** — browse properties filtered by **3 criteria**: Category, Rating, Location. Cards link to the detail page.
- **House detail** — 3-photo gallery with thumbnail navigation, spirit-skull rating, price, location map, contact info, and a **"Request a Viewing"** modal form.
- **Team page** — 4 member cards with name, student ID, and faculty.
- **Sticky navigation bar** on every page linking to Buy / Rent / Our Team / Home / Admin.

### Admin (login required)

- **Authenticated login** — username/password form with Remember-me, password show/hide toggle, and error feedback.
- **Product Management dashboard** — stats summary cards, full property table with live search, and View / Edit / Delete action buttons.
- **Add New House** — quick-add modal form accessible directly from the search toolbar.
- **Edit House** — dedicated page to change image, name, price, description, and location.
- **Profile dropdown** top-right with admin name and Sign Out button.

### CRUD Summary

| Operation | Front-end trigger | API endpoint called |
| --------- | ----------------- | ------------------- |
| **Create** | Dashboard → + Add New House | `POST /houses` |
| **Read / Search** | Buy / Rent / Search pages | `GET /houses/search` |
| **Update** | Dashboard → Edit | `PUT /houses/:id` |
| **Delete** | Dashboard → Delete → confirm | `DELETE /houses/:id` |
| **Admin Login** | admin-login.html | `POST /admin/login` |

---

## Web Services — `app.js`

Base URL: **`http://localhost:3000`**  
All routes are defined in `sec2_gr3_ws_src/app.js`.  
Request bodies use **raw JSON** (`Content-Type: application/json`).

---

### 1. Search Houses — `GET /houses/search`

Supports **3 optional query criteria** (any combination or none for all results):

| Query param | Type | Description |
| ----------- | ---- | ----------- |
| `category` | string | Exact match on `HouseCategory.CategoryName` e.g. `Mansion` |
| `rating` | number | Minimum average `RatingValue` from the `Rating` table |
| `location` | string | Partial `LIKE` match across AreaName, Province, District, Subdistrict, Zipcode |

Returns: `{ count, data[] }` — array of houses with `avgRating` included.

**Test case 1 — category + location:**
```
GET http://localhost:3000/houses/search?category=Mansion&location=Bangkok
```
Expected → `200 OK` with houses whose category is "Mansion" and area contains "Bangkok".

**Test case 2 — rating + location:**
```
GET http://localhost:3000/houses/search?rating=4&location=Chiang
```
Expected → `200 OK` with houses whose average rating ≥ 4 and area contains "Chiang".

---

### 2. Insert House — `POST /houses`

Creates a new record in the `House` table.

**Required body fields:** `HouseID`, `HouseName`, `HousePrice`, `bedroomCount`, `bathroomCount`, `basementCount`, `HcategoryID`, `HAreaName`  
**Optional:** `Description`

**Test case 1 — success:**
```
POST http://localhost:3000/houses
Content-Type: application/json

{
  "HouseID": "H0000000011",
  "HouseName": "The Phantom Villa",
  "bedroomCount": 3,
  "bathroomCount": 2,
  "basementCount": 1,
  "Description": "A chilling three-storey villa with an infamous past.",
  "HcategoryID": "CAT00001",
  "HAreaName": "Salaya",
  "BuyingStatus": true,
  "RentingStatus": true,
  "BuyingPrice": 2500000,
  "RentingPrice": 9000
}

```
Expected → `201 Created` `{ "message": "House inserted successfully.", "HouseID": "H0000000011" }`

**Test case 2 — missing required field:**
```
POST http://localhost:3000/houses
Content-Type: application/json

{
  "HouseName": "Incomplete House"
}
```
Expected → `400 Bad Request` `{ "error": "Missing required fields." }`

---

### 3. Update House — `PUT /houses/:id`

Updates one or more fields of an existing `House` record.  
Send only the fields you want to change (any subset of the 8 allowed fields).

**Test case 1 — success:**
```
PUT http://localhost:3000/houses/H0000000001
Content-Type: application/json

{
  "BuyingPrice": 3500000
}
```
Expected → `200 OK` `{ "message": "House updated successfully.", "HouseID": "H0000000001" }`

**Test case 2 — house not found:**
```
PUT http://localhost:3000/houses/NOTEXIST
Content-Type: application/json

{
  "HouseName": "Ghost House"
}
```
Expected → `404 Not Found` `{ "error": "House 'NOTEXIST' not found." }`

---

### 4. Delete House — `DELETE /houses/:id`

Removes a `House` record by its `HouseID`.

**Test case 1 — success:**
```
DELETE http://localhost:3000/houses/H0000000001
```
Expected → `200 OK` `{ "message": "House deleted successfully.", "HouseID": "H0000000001" }`

**Test case 2 — house not found:**
```
DELETE http://localhost:3000/houses/NOTEXIST
```
Expected → `404 Not Found` `{ "error": "House 'NOTEXIST' not found." }`

---

### 5. Admin Login (Authentication) — `POST /admin/login`

Verifies `AdminID` and `Password` against the `Admin` table.  
Returns admin info (password excluded) on success.

**Test case 1 — correct credentials:**
```
POST http://localhost:3000/admin/login
Content-Type: application/json

{
  "AdminID": "A000000001",
  "Password": "admin1234"
}
```
Expected → `200 OK` `{ "message": "Login successful.", "admin": { "AdminID": "...", "Aname": "...", "AdminGmail": "...", ... } }`

**Test case 2 — wrong password:**
```
POST http://localhost:3000/admin/login
Content-Type: application/json

{
  "AdminID": "A000000001",
  "Password": "wrongPassword"
}
```
Expected → `401 Unauthorized` `{ "error": "Invalid AdminID or password." }`

### 6. Request viewing house — `POST /request-viewing`

**Test case 1 — success:**
```
POST http://localhost:3000/request-viewing
Content-Type: application/json

{
  "VCustomerID": "C000000001",
  "VHouseID": "H0000000002",
  "RequestDate": "2024-02-01"
}
```
Expected → `201 Created` `{ "message": "Request viewing successfully.", "VCustomerID": "C000000001", "VHouseID": "H0000000002", "RequestDate": "2024-02-01" }`

**Test case 2 — missing required fields:**
```
POST http://localhost:3000/rating
Content-Type: application/json

{
  "VCustomerID": "C0000000002",
  "VHouseID": "H0000000005"
}
```
Expected → `400 Bad Request` `{ "error": "VCustomerID, VHouseID, and RequestDate are required." }`

### 7. Rating a house — `POST /rating`

**Test case 1 — success:**
```
POST http://localhost:3000/request-viewing
Content-Type: application/json

{
  "RHouseID": "H0000000001",
  "RatingValue": 5
}
```
Expected → `200 OK` `{ "message": "Rating updated successfully."}`

**Test case 2 — missing required fields:**
```
POST http://localhost:3000/rating
Content-Type: application/json

{
  "RatingValue": 5
}
```
Expected → `400 Bad Request` `{ "error": "RHouseID and RatingValue are required." }`


## References

- Fonts: [Google Fonts — Cinzel & Crimson Text](https://fonts.google.com)
- Placeholder images: [Picsum Photos](https://picsum.photos) · [Unsplash](https://unsplash.com)
- Icons: inline SVG (no third-party icon library)

---