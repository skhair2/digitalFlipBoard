# Digital Flipboard

Transform any screen into a stunning split-flap message board. Control from your phone, display on your TV. No hardware required. Free forever.

## Features

- **Split-Flap Display**: Realistic split-flap animation and sound effects.
- **Remote Control**: Control the display from your mobile phone.
- **Real-time Updates**: Messages update instantly using WebSockets.
- **Customizable**: Choose from various color themes and animations.
- **Free**: No hardware costs, just use your existing devices.

## 🚀 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    cd server && npm install && cd ..
    ```

2.  **Start the Application**
    ```bash
    # Terminal 1: Start Frontend (UI)
    npm run dev
    
    # Terminal 2: Start Backend (Server)
    npm run server
    ```

3.  **Access the App**
    -   **Frontend (Use this):** [http://localhost:3000](http://localhost:3000)
    -   **Backend API:** [http://localhost:3001](http://localhost:3001)

## 📱 Usage

-   **Control Panel**: [http://localhost:3000/control](http://localhost:3000/control)
-   **Display Board**: [http://localhost:3000/display](http://localhost:3000/display)

## Technologies

- React
- Vite
- Tailwind CSS
- Supabase (Auth & Realtime)
- Zustand (State Management)

## License

MIT
