# PalayAI

## Overview

KontratAni is a modern web application built with React, TypeScript, Vite, and ShadCN UI components. It serves as a comprehensive platform that connects farmers, buyers, and cooperative managers to streamline contract management, payments, and agricultural operations. The app features role-based dashboards, AI-powered assistants, and mobile-friendly interfaces to facilitate efficient communication and transactions in the agricultural supply chain.

## Purpose

The primary purpose of KontratAni is to bridge the gap between farmers and agricultural companies by providing a digital platform for:

- *Contract Creation and Management*: Farmers and buyers can create, negotiate, and manage contracts digitally.
- *Payment Processing*: Secure and transparent payment tracking and direct payouts.
- *AI Assistance*: Integrated AI chatbots and report generation for contract analysis and decision support.
- *Role-Based Access*: Separate interfaces for farmers, buyers, managers, and mobile users.
- *Quota Allocation and Monitoring*: Managers can allocate and track production quotas.
- *SMS Integration*: Mobile SMS hub for remote communication.

This application was originally developed for a hackathon to demonstrate innovative solutions in agricultural technology.

## Features

- *Farmer Dashboard*: Contract progress tracking, AI reports, direct payouts, and profile management.
- *Buyer Dashboard*: Contract views, demand management, payments overview, and dashboard analytics.
- *Manager Dashboard*: Contract inbox, quota allocation, payout management, SMS hub, and land profile views.
- *AI Integration*: Chatbots for contract assistance and automated report generation.
- *Mobile Support*: Dedicated mobile view with SMS functionality.
- *Responsive Design*: Built with Tailwind CSS for cross-device compatibility.

## Tech Stack

- *Frontend*: React 18, TypeScript
- *Build Tool*: Vite
- *UI Library*: ShadCN UI (Radix UI components)
- *Styling*: Tailwind CSS
- *State Management*: Zustand (useAppStore)
- *Routing*: React Router
- *Animations*: Framer Motion
- *Testing*: Vitest, Playwright
- *Package Manager*: Bun 

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- Bun package manager (recommended, or npm/yarn)

### Installation

1. Clone the repository:

   
   git clone <repository-url>
   cd kontratani
   

2. Navigate to the project directory:

   
   cd KontratAni
   

3. Install dependencies:
   
   bun install
   
   or
   
   npm install
   

### Running the Application

1. Start the development server:

   
   bun run dev
   

   or

   
   npm run dev
   

2. Open your browser and navigate to http://localhost:5173 (or the port shown in the terminal).

## Usage

1. *Authentication*: Start by logging in or registering on the main page.
2. *Role Selection*: Choose your role (Farmer, Buyer, Manager) to access the appropriate dashboard.
3. *Navigation*: Use the sidebar to navigate between different views like contracts, payments, reports, etc.
4. *AI Assistance*: Interact with AI chatbots for contract-related queries and report generation.
5. *Mobile Access*: Use the mobile view for SMS-based interactions when on the go.

## Project Structure

src/
├── components/
│   ├── buyer/          # Buyer-specific components
│   ├── farmer/         # Farmer-specific components
│   ├── manager/        # Manager-specific components
│   ├── mobile/         # Mobile interface components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Main page components
└── store/              # State management

## Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add some amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for a hackathon to showcase agricultural technology innovations
- Uses ShadCN UI for beautiful, accessible components
- Powered by modern web technologies for fast, responsive experiences
