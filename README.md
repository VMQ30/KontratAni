# PalayAI

## Overview

KontratAni is a modern web application built with React, TypeScript, Vite, and ShadCN UI components. It serves as a comprehensive platform that connects farmers, buyers, and cooperative managers to streamline contract management, payments, and agricultural operations. The app features role-based dashboards, AI-powered assistants, and mobile-friendly interfaces to facilitate efficient communication and transactions in the agricultural supply chain.

## Purpose

The primary purpose of KontratAni is to bridge the gap between farmers and agricultural companies by providing a digital platform for:

- _Contract Creation and Management_: Farmers and buyers can create, negotiate, and manage contracts digitally.
- _Payment Processing_: Secure and transparent payment tracking and direct payouts.
- _AI Assistance_: Integrated AI chatbots and report generation for contract analysis and decision support.
- _Role-Based Access_: Separate interfaces for farmers, buyers, managers, and mobile users.
- _Quota Allocation and Monitoring_: Managers can allocate and track production quotas.
- _SMS Integration_: Mobile SMS hub for remote communication.

This application was originally developed for a hackathon to demonstrate innovative solutions in agricultural technology.

## Features

- _Farmer Dashboard_: Contract progress tracking, AI reports, direct payouts, and profile management.
- _Buyer Dashboard_: Contract views, demand management, payments overview, and dashboard analytics.
- _Manager Dashboard_: Contract inbox, quota allocation, payout management, SMS hub, and land profile views.
- _AI Integration_: Chatbots for contract assistance and automated report generation.

## Tech Stack

- _Frontend_: React 18, TypeScript
- _Build Tool_: Vite
- _UI Library_: ShadCN UI (Radix UI components)
- _Styling_: Tailwind CSS
- _State Management_: Zustand (useAppStore)
- _Routing_: React Router
- _Animations_: Framer Motion
- _Testing_: Vitest, Playwright
- _Package Manager_: Bun

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

   (if there are any errors, type npm install --force instead)

### Running the Application

1. Start the development server:

   bun run dev

   or

   npm run dev

2. Open your browser and navigate to http://localhost:5173 (or the port shown in the terminal).

## Usage

1. _Authentication_: Start by logging in or registering on the main page.
2. _Role Selection_: Choose your role (Farmer, Buyer, Manager) to access the appropriate dashboard.
3. _Navigation_: Use the sidebar to navigate between different views like contracts, payments, reports, etc.
4. _AI Assistance_: Interact with AI chatbots for contract-related queries and report generation.
5. _Mobile Access_: Use the mobile view for SMS-based interactions when on the go.

## Project Structure

src/
├── components/
│ ├── buyer/ # Buyer-specific components
│ ├── farmer/ # Farmer-specific components
│ ├── manager/ # Manager-specific components
│ ├── mobile/ # Mobile interface components
│ └── ui/ # Reusable UI components
├── hooks/ # Custom React hooks
├── lib/ # Utility functions
├── pages/ # Main page components
└── store/ # State management

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
