# GCE Public & Driver Frontend (Standalone)

This is a lightweight, **backend-disconnected** copy of the attendance frontend containing only Public (Student) and Driver pages. No Admin panel.

## Quick Start

```bash
npm install
npm start
```

The app will start on `http://localhost:3000`.

## Connecting to Backend

**Step 1:** Edit `/Users/durga/xyz/frontend_public_driver/src/lib/api.js`

Find this section:
```javascript
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
```

Replace with your backend URL:
```javascript
const API_URL = 'http://localhost:8000';
```

**Step 2:** Uncomment the actual API calls

In `src/lib/api.js`, each function has commented-out axios calls. Uncomment them and comment out the mock responses.

Example:
```javascript
// BEFORE (disconnected - mock data)
return {
  data: { buses: [...mock data...] }
};

// AFTER (connected - real API)
const response = await axios.get(`${API_URL}/api/public/buses/`);
return response;
```

**Step 3:** Test the connection

- Start your backend server (Django on port 8000)
- Start this frontend (`npm start`)
- Try logging in or viewing buses

## Project Structure

```
src/
├── pages/
│   ├── public/          # Student app: PublicMap, PublicLogin, PublicSignup
│   └── driver/          # Driver app: DriverHome, BusLogin, AmbulanceLogin, etc.
├── components/
│   └── ui/              # Reusable UI components (Button, Input, Dialog, etc.)
├── context/
│   └── AuthContext.js   # Auth state & API URL configuration
├── lib/
│   └── api.js           # API wrapper (CONFIGURE BACKEND URL HERE)
├── App.js               # Routes (Public + Driver only, no Admin)
└── index.js             # Entry point
```

## Test Accounts (from Backend)

Once connected, create test accounts using:

```bash
curl -X POST http://localhost:8000/api/auth/create-test-students/ \
  -H "Content-Type: application/json" \
  -d '{"count": 1}'
```

Or use your own credentials from the backend.

## Features

✅ Public Student App  
✅ Bus Driver App  
✅ Ambulance Driver App  
✅ Authentication (Login/Signup)  
✅ Dark theme with Glassmorphism UI  

❌ No Admin Panel  
❌ Backend disconnected by default (see "Connecting to Backend" above)

## Backend API Endpoints

Once connected, the app calls:

- `POST /api/auth/login/` - Login
- `POST /api/auth/signup/` - Register
- `POST /api/auth/me/` - Get current user
- `GET /api/public/buses/` - List active buses
- `GET /api/public/bus/{id}/eta/` - Get bus ETA
- `GET /api/driver/trip/active/` - Get active trip
- `POST /api/driver/location/update/` - Update driver location

## Styles

- Dark theme by default
- Glassmorphism card effects
- Responsive Tailwind-like classes
- Custom animations (pulse, spin, ping)

## Notes

- This is a **disconnected copy** – it has no backend connection by default
- All API calls return mock data until you edit `src/lib/api.js`
- The `AuthContext.js` file has inline instructions on where to set the API URL
- No admin pages, no admin authentication
