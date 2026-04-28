/**
 * script.js — Long Gone Front-End Client API Layer
 * Section 2, Group 3 — ITCS223
 *
 * Shared Fetch API module for all calls to the back-end web service
 * (sec2_gr3_ws_src/app.js) running on http://localhost:3000.
 *
 * Include BEFORE any page-specific scripts:
 *   <script src="../script.js"></script>
 */

// ─── Base URL ────────────────────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:3000';

// ─── Generic fetch wrapper ───────────────────────────────────────────────────
/**
 * Fetch helper with JSON parsing and error propagation.
 * @param {string} endpoint  - relative path, e.g. '/houses/search?category=Mansion'
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
}

// ─── 1. GET all houses ───────────────────────────────────────────────────────
/**
 * Retrieve every house with full details.
 * @returns {Promise<{ count: number, data: object[] }>}
 *
 * @example
 *   const { data } = await getAllHouses();
 */
async function getAllHouses() {
    return apiFetch('/houses');
}

// ─── 2. GET house by ID ──────────────────────────────────────────────────────
/**
 * Retrieve a single house by its HouseID.
 * @param {string} houseId  e.g. 'H0000000001'
 * @returns {Promise<{ data: object }>}
 *
 * @example
 *   const { data } = await getHouseById('H0000000001');
 */
async function getHouseById(houseId) {
    return apiFetch(`/houses/${encodeURIComponent(houseId)}`);
}

// ─── 3. Search / filter houses ───────────────────────────────────────────────
/**
 * Search houses with optional filters.
 * @param {{ category?: string, rating?: number, location?: string, type?: 'buy'|'rent' }} [filters]
 * @returns {Promise<{ count: number, data: object[] }>}
 *
 * @example
 *   const results = await searchHouses({ category: 'Mansion', location: 'Bangkok' });
 *   const buyable = await searchHouses({ type: 'buy' });
 */
async function searchHouses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.rating)   params.set('rating',   filters.rating);
    if (filters.location) params.set('location', filters.location);
    if (filters.type)     params.set('type',     filters.type);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/houses/search${query}`);
}

// ─── 4. Insert house (Admin) ──────────────────────────────────────────────────
/**
 * Create a new house record.
 *
 * Required fields:
 *   HouseID, HouseName, bedroomCount, bathroomCount, basementCount,
 *   HcategoryID, HAreaName, BuyingStatus (bool), RentingStatus (bool),
 *   BuyingPrice, RentingPrice
 *
 * Optional: Description
 *
 * @param {object} houseData
 * @returns {Promise<{ message: string, HouseID: string }>}
 *
 * @example
 *   await insertHouse({
 *       HouseID: 'H0000000010', HouseName: 'The Phantom Villa',
 *       bedroomCount: 3, bathroomCount: 2, basementCount: 1,
 *       HcategoryID: 'CAT00001', HAreaName: 'Salaya',
 *       BuyingStatus: true, RentingStatus: false,
 *       BuyingPrice: 2500000, RentingPrice: 0
 *   });
 */
async function insertHouse(houseData) {
    return apiFetch('/houses', {
        method: 'POST',
        body: JSON.stringify(houseData),
    });
}

// ─── 5. Update house (Admin) ─────────────────────────────────────────────────
/**
 * Partially update an existing house.
 * Send only the fields you want to change.
 *
 * Allowed fields:
 *   HouseName, bedroomCount, bathroomCount, basementCount,
 *   Description, HcategoryID, HAreaName,
 *   BuyingStatus, RentingStatus, BuyingPrice, RentingPrice
 *
 * @param {string} houseId
 * @param {object} fields
 * @returns {Promise<{ message: string, HouseID: string }>}
 *
 * @example
 *   await updateHouse('H0000000001', { BuyingPrice: 3500000, HouseName: 'New Name' });
 */
async function updateHouse(houseId, fields) {
    return apiFetch(`/houses/${encodeURIComponent(houseId)}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
    });
}

// ─── 5.5 Update Rating (Admin) ─────────────────────────────────────────────────
/**
 * Force overwrite the rating for a house.
 * @param {string} houseId 
 * @param {number} ratingValue 
 */
async function updateRating(houseId, ratingValue) {
    return apiFetch(`/rating`, {
        method: 'POST',
        body: JSON.stringify({ RHouseID: houseId, RatingValue: ratingValue }),
    });
}

// ─── 5.6 Update House Photos (Admin) ──────────────────────────────────────────
/**
 * Upload an array of base64 photo strings to completely replace existing photos
 * @param {string} houseId 
 * @param {string[]} photos 
 */
async function updateHousePhotos(houseId, photos) {
    return apiFetch(`/houses/${encodeURIComponent(houseId)}/photos`, {
        method: 'POST',
        body: JSON.stringify({ photos }),
    });
}

// ─── 6. Delete house (Admin) ─────────────────────────────────────────────────
/**
 * Delete a house and all its child records (cascade via transaction).
 * @param {string} houseId
 * @returns {Promise<{ message: string, HouseID: string }>}
 *
 * @example
 *   await deleteHouse('H0000000001');
 */
async function deleteHouse(houseId) {
    return apiFetch(`/houses/${encodeURIComponent(houseId)}`, {
        method: 'DELETE',
    });
}

// ─── 7. Admin login ───────────────────────────────────────────────────────────
/**
 * Authenticate an admin.
 * @param {string} adminId    e.g. 'ADM0000001'
 * @param {string} password
 * @returns {Promise<{ message: string, admin: object }>}
 *
 * @example
 *   const { admin } = await loginAdmin('ADM0000001', 'securePass123');
 *   saveAdminSession(admin);
 */
async function loginAdmin(adminId, password) {
    return apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ AdminID: adminId, Password: password }),
    });
}

// ─── 8. Admin register ────────────────────────────────────────────────────────
/**
 * Register a new admin account.
 * Required: AdminID, Aname, AdminGmail, AdminPhoneNumber, Salary, Password
 * @param {object} adminData
 * @returns {Promise<{ message: string, AdminID: string }>}
 */
async function registerAdmin(adminData) {
    return apiFetch('/admin/register', {
        method: 'POST',
        body: JSON.stringify(adminData),
    });
}

// ─── 9. Request Viewing ───────────────────────────────────────────────────────
/**
 * Submit a house viewing request.
 * @param {string} customerId  - VCustomerID (use a generated guest ID if anonymous)
 * @param {string} houseId     - VHouseID
 * @param {string} requestDate - ISO date string e.g. '2026-04-26'
 * @returns {Promise<{ message: string, VCustomerID: string, VHouseID: string, RequestDate: string }>}
 *
 * @example
 *   await requestViewing('C000000001', 'H0000000001', '2026-05-10');
 */
async function requestViewing(customerId, houseId, requestDate) {
    return apiFetch('/request-viewing', {
        method: 'POST',
        body: JSON.stringify({ VCustomerID: customerId, VHouseID: houseId, RequestDate: requestDate }),
    });
}

// ─── Session helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = 'lg_admin';

/** Persist the logged-in admin object for the current browser session only. */
function saveAdminSession(admin) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(admin));
}

/** Get the current admin from storage (null if not logged in). */
function getAdminSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

/** Clear the admin session (sign out). */
function clearAdminSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Redirect to log_in.html if no active admin session.
 * Call this at the top of every admin-protected page.
 * @example
 *   requireAdminSession();
 */
function requireAdminSession() {
    if (!getAdminSession()) {
        window.location.href = '/log_in';
    }
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
/**
 * Show a brief, animated toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='success']
 * @param {number} [duration=3000] milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    const colors = { success: '#198754', error: '#dc3545', info: '#0d6efd' };

    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        position:       'fixed',
        bottom:         '2rem',
        right:          '2rem',
        backgroundColor: colors[type] || colors.info,
        color:          'white',
        padding:        '1rem 1.8rem',
        borderRadius:   '0.5rem',
        fontFamily:     "'Inter', sans-serif",
        fontSize:       '0.95rem',
        fontWeight:     '500',
        boxShadow:      '0 4px 12px rgba(0,0,0,0.25)',
        zIndex:         '9999',
        opacity:        '0',
        transform:      'translateY(20px)',
        transition:     'opacity 0.3s, transform 0.3s',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ─── Date helper ──────────────────────────────────────────────────────────────
/** Return today as DD/MM/YYYY */
function todayDateString() {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
