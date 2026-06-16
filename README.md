<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  
  <br />
  <br />
  
  <h1>🏥 CareBridge</h1>
  <p><strong>Every Second Counts. CareBridge Connects.</strong></p>
  <p><em>An intelligent, real-time emergency medical response and hospital resource management platform.</em></p>
</div>

---

## 📖 About CareBridge

In emergencies, time is the ultimate currency. **CareBridge** eliminates the critical delays caused by disorganized information during medical crises. It acts as a centralized bridge connecting patients directly to life-saving resources—like ICU beds, oxygen supplies, blood banks, and instant ambulance dispatches—all powered by real-time data and AI assistance.

Whether you're a patient seeking urgent care or a hospital managing incoming emergencies, CareBridge ensures seamless coordination.

---

## ✨ Key Features

### 🌟 For Patients & Users
*   **Live Resource Tracking**: View real-time availability of ICU beds, Oxygen beds, General wards, and Ventilators across a network of registered hospitals.
*   **Live Hospital Map**: Interactive map integration to find the nearest hospitals with verified visual indicators.
*   **Instant Ambulance Booking**: One-click access to dispatch emergency (108) or transport (102) ambulances based on the severity of the situation.
*   **Blood Bank Network**: Search for specific blood types (e.g., O+, AB-) instantly.
*   **CareBot AI**: An intelligent, natural language chatbot trained to provide immediate First Aid instructions (CPR, burns, strokes) and guide users to the right resources.

### 🏥 For Hospitals & Admins
*   **Hospital Portal**: Secure, authenticated dashboard for hospital staff to manage their live inventory (beds, blood, specialties).
*   **Verification System**: Integrated certificate upload and validation system to ensure a 100% verified hospital network.
*   **Admin Oversee**: Comprehensive admin panel to manage the platform, users, and connected medical facilities.

---

## 🛠️ Technology Stack

CareBridge is built using the robust **MERN** stack, augmented with modern tooling for real-time capabilities and AI.

### Frontend
*   **React.js**: Modular, component-driven UI.
*   **Vite**: Ultra-fast build tool and development server.
*   **React-Leaflet**: Interactive map rendering and geolocation.
*   **Lucide React**: Clean, modern iconography.
*   **Socket.io-client**: Real-time websocket connections for instant dashboard updates.

### Backend
*   **Node.js & Express.js**: Scalable REST API architecture.
*   **MongoDB (Mongoose)**: NoSQL database for flexible storage of hospital and user records.
*   **Socket.io**: Enabling real-time, bidirectional communication between hospitals and patient dashboards.
*   **Natural (NLP)**: Machine learning library powering the CareBot AI's intent recognition and responses.
*   **JWT & Bcrypt**: Secure authentication and password hashing.
*   **Multer**: Handling secure medical certificate uploads.

---

## 🚀 Getting Started

Follow these steps to set up CareBridge on your local machine.

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB (Local instance or Atlas URI)
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/carebridge.git
cd carebridge
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the server.

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/carebridge
JWT_SECRET=your_super_secret_key
```

Start the backend development server:
```bash
npm run dev
# The server will start on http://localhost:5001
# Note: CareBridge includes a fallback mechanism. If MongoDB is unavailable, it will automatically switch to a comprehensive 'Mock Data' mode covering 50+ hospitals.
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Vite server.

```bash
cd frontend
npm install
npm run dev
# The application will launch on http://localhost:5173
```

---

## 🤖 CareBot AI Interaction :

CareBridge features an integrated NLP chatbot trained to handle high-stress situations. It categorizes user input into specific intents:
*   **Emergency Advice**: Recognizes symptoms and trauma (Heart Attack, Stroke, Choking, Bleeding) and instantly provides critical First Aid/CPR steps.
*   **Resource Navigation**: Understands requests like "I need an ICU bed" or "Where is O- blood?" and dynamically points the user to live dashboard tracking.

---

## 🤝 Contributing

We welcome contributions to make CareBridge even better!
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
<div align="center">
  <p>Built with 😎 to save lives.</p>
</div>
