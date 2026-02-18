# CareBridge - Emergency Response & Hospital Management System

CareBridge is a comprehensive web-based platform designed to bridge the gap between patients and emergency medical services. It provides real-time information on hospital bed availability, blood bank stocks, and ambulance services, while also facilitating hospital management and patient interaction through a dedicated portal.

## 🚀 Key Features

*   **Real-Time Dashboard**: View live status of ICU beds, Oxygen beds, and Ventilators across registered hospitals.
*   **Interactive Map**: Locate nearby hospitals with visual indicators for verification and bed availability.
*   **Ambulance Booking**: Quick access to emergency (108) and transport (102) ambulance services.
*   **AI Chatbot**: An intelligent assistant for medical emergencies (CPR, First Aid) and platform navigation.
*   **Hospital Portal**: Secure login for hospitals to update their inventory (beds, blood) and manage emergency status.
*   **Patient Portal**: User account management for personalized services.
*   **Blood Bank Search**: Find blood availability by type and hospital.
*   **Admin Panel**: For platform administrators to oversee operations.

## 🛠️ Technology Stack

### Frontend
*   **React.js**: UI Component library.
*   **Vite**: Fast build tool and development server.
*   **Leaflet / React-Leaflet**: Interactive maps.
*   **Socket.io-client**: Real-time updates.
*   **Chart.js**: Visual data representation.
*   **Lucide React**: Iconography.

### Backend
*   **Node.js & Express**: Server-side framework.
*   **MongoDB (Mongoose)**: Database for storing hospitals, users, and emergency requests.
*   **Socket.io**: Real-time bidirectional communication.
*   **Natural**: NLP library for the AI chatbot.
*   **JWT & Bcrypt**: Authentication and security.
*   **Firebase Admin**: Integration for additional backend services.

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/carebridge.git
    cd carebridge
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Create a .env file with your credentials (MONGO_URI, JWT_SECRET, etc.)
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the Application**
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:5001`

## 🧠 AI Chatbot
The integrated AI chatbot is trained to handle:
*   **Emergency Advice**: CPR, Heart Attack, Stroke, Burns, etc.
*   **Platform Info**: How to register, book ambulances, etc.
*   **General Queries**: Greetings and capabilities.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License
This project is licensed under the MIT License.
