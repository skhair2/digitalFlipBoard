# Agent Mission

**Objective:** Build a high-performance, real-time digital split-flap display platform.

## Description
This project provides a digital alternative to mechanical split-flap boards, enabling remote control and real-time synchronization across devices. The system consists of:
1.  **Controller Application (`web`)**: A user interface for composing messages, managing sessions, and configuring board settings.
2.  **Display Application (`display`)**: A specialized rendering engine that simulates the physical flip-flap animation and displays messages in real-time.
3.  **Real-time Backend (`api`)**: A Socket.io-powered server that facilitates low-latency communication and session pairing.
4.  **Background Processing (`worker`)**: Handles asynchronous tasks such as email notifications and scheduled message delivery.

## Success Criteria
- **Low Latency**: Messages sent from the controller appear on the display in sub-second time.
- **Visual Fidelity**: Animations are smooth (60fps) and accurately simulate the mechanical split-flap experience.
- **Scalability**: The system supports multiple concurrent sessions using a Redis-backed Socket.io adapter.
- **Security**: User data and board access are protected via Supabase Auth and Row-Level Security (RLS) policies.
- **Reliability**: The system handles reconnections and network interruptions gracefully without losing state.
