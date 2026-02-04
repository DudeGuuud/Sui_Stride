# SuiStride

**SuiStride** is a Web3 fitness platform built on the Sui blockchain, enabling a "Stake-to-Win" economy where physical effort translates to digital value. By leveraging high-precision GPS tracking and verifiable on-chain settlements, we are bridging the gap between Move-to-Earn concepts and professional athletic standards.

---

## 🛠 Technical Architecture

### 1. High-Precision Location Engine (`hooks/use-location-tracking.ts`)

We rejected the standard "balanced" geolocation approach in favor of a navigation-grade implementation essential for fair competition.

*   **Provider**: `expo-location`
*   **Accuracy Mode**: `Location.Accuracy.BestForNavigation` (Highest power, highest precision).
*   **Sampling Rate**: 1Hz (1 second interval).
*   **Hardware Filter**: 1-meter displacement threshold.

#### Signal-to-Noise Filtering
Raw GPS data is noisy. We implement a two-stage software filter to prevent "stationary drift" (accumulating distance while standing still):

1.  **Accuracy Gate**: Any point with a horizontal accuracy > 20 meters is immediately discarded.
2.  **Micro-Movement Gate**: Displacements < 2 meters between samples are treated as noise and ignored.

### 2. Algorithmic Core (`app/workout/tracking.tsx`)

#### Metabolic Calculation (Calories)
We moved away from linear time-based estimation to the **ACSM (American College of Sports Medicine) Metabolic Equation**. This ensures energy expenditure reflects intensity, not just duration.

*   **Formula**: Cumulative summation of energy cost per second.
*   **Logic**:
    *   **Walking (< 0.8 m/s)**: `VO2 = 0.1 * speed(m/min) + 3.5`
    *   **Running (≥ 0.8 m/s)**: `VO2 = 0.2 * speed(m/min) + 3.5`
    *   **Energy**: `Kcal/min = (VO2 * WeightKg) / 200`

#### Pace Computing
Dual-mode pace calculation for maximum utility:
1.  **Average Pace**: `Total Elapsed Time / Total Distance`. Represents the overall session performance.
2.  **Real-Time Pace**: Derived directly from the GPS Doppler shift (`location.speed`).
    *   **Unit**: Minutes per Kilometer (min/km).
    *   **Smoothing**: Handles stationary (`0 m/s`) and ultra-low speed edge cases to avoid `Infinity` or meaningless values.

### 3. Visual System

*   **Map Engine**: `react-native-maps` with a custom "Cyberpunk" dark theme (`constants/map-style.json`) optimized for OLED screens and night running.
*   **UI Framework**: NativeWind (Tailwind CSS) + React Native Reanimated.
*   **Performance**: All animations (progress bars, map updates) run on the UI thread (Worklets) to ensure 60fps performance even during heavy GPS I/O.

### 4. Blockchain Integration (Planned)
*   **Network**: Sui Mainnet.
*   **Auth**: zkLogin (Google/Apple to Sui Address).
*   **Settlement**: Move Smart Contracts using Programmable Transaction Blocks (PTB) for atomic stake-and-reward logic.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (LTS)
*   Bun / npm
*   Expo Go (for testing)

### Installation

```bash
# Install dependencies
bun install

# Start the development server
npx expo start
```

### Simulation vs. Reality
*   **Android Emulator**: You must use the emulator's extended controls to simulate "Routes" (GPX playback) to test the tracking logic. Static location mocking will trigger the noise filters.
*   **Real Device**: Recommended. Ensure "High Accuracy" location services are enabled.

---

## ⚠️ Known Constraints
*   **Indoor Tracking**: The current engine relies on GNSS (GPS/Galileo/BeiDou). Indoor treadmill runs will not be tracked accurately without step-counting integration (Roadmap Item 1.1).
*   **Battery Usage**: `BestForNavigation` mode is power-intensive. Future updates will introduce an adaptive sampling rate based on battery level.