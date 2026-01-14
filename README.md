# ShareEat

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Python Version](https://img.shields.io/badge/python-3.11%2B-blue)
![React Version](https://img.shields.io/badge/react-18.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**ShareEat** is a scalable, full-stack platform engineered to optimize the logistics of food redistribution. By leveraging real-time data and role-based workflows, the system bridges the gap between surplus food providers (Donors) and humanitarian organizations (Recipients), facilitated by a network of Volunteers.

---

## Table of Contents

1. [About The Project](#about-the-project)
2. [System Architecture](#system-architecture)
3. [Key Features](#key-features)
4. [Workflows & Logic](#workflows--logic)
5. [Technology Stack](#technology-stack)
6. [Getting Started](#getting-started)
7. [API Documentation](#api-documentation)

---

## About The Project

Food waste and hunger are two conflicting global challenges. **ShareEat** provides a technological solution to this dichotomy by facilitating the efficient transfer of surplus food from donors to recipients.

The platform is built as a distributed system using a microservices-ready architecture. It features a robust Django backend for complex data relationships and a responsive React frontend for seamless user interaction.

### Core Objectives

- **Minimization of Waste**: Streamline the reporting and collection of surplus food.
- **Operational Efficiency**: Automate the matching and delivery assignment process.
- **Transparency**: Provide real-time tracking and audit trails for every donation.

---

## System Architecture

The application follows a decoupled client-server architecture:

- **Frontend Layer**: A Single Page Application (SPA) built with React and Vite, communicating via RESTful APIs. It handles state management, routing, and role-based UI rendering.
- **Backend Layer**: A Django-based REST API that manages business logic, database transactions, and authentication.
- **Data Layer**: SQLite (Dev) / PostgreSQL (Prod) serving as the primary relational database store.
- **Security**: JWT (JSON Web Tokens) for stateless authentication with automatic token rotation.

---

## Key Features

### 1. Donor Module
- **Inventory Management**: Log surplus items with metadata (expiry, quantity, type).
- **Lifecycle Control**: 
  - *Approved* items are hidden from the public inventory to prevent double-booking.
  - *Rejected* items are restored to the inventory for re-evaluation.
  - *Deleted* items are permanently removed from the system.
- **Impact Analytics**: Visual reports on contribution history and social impact metrics.

### 2. Recipient Module
- **Real-time Marketplace**: Live feed of available donations filtered by proximity and category.
- **Request Management**: Request food items and track their status from "Pending" to "Delivered".
- **Volunteer Rating**: Rate volunteers (0-5 stars) upon delivery confirmation.

### 3. Volunteer & Logistics Module
- **Smart Assignment**: Automated or manual assignment of delivery tasks.
- **Status Tracking**: 
  - *Pending*: Waiting for assignment.
  - *On the Way*: Volunteer has picked up the donation (synced with "Picked Up" status).
  - *Delivered*: Donation has reached the recipient.
- **Dashboard**: Centralized view of active deliveries and historical performance.

### 4. Administration
- **Network Intelligence**: High-level view of system health and transaction volumes.
- **User Verification**: Tools for vetting new organizations.
- **Manual Override**: Ability to manually assign volunteers if automated matching fails.

---

## Workflows & Logic

### Donation Lifecycle
1. **Creation**: Donor posts a food item. Status: *Available*.
2. **Request**: Recipient requests the item. Status: *Requested*.
3. **Approval**: Donor approves the request. 
   - Item `is_available` flag set to `False`.
   - Donation record created.
4. **Assignment**: Volunteer accepts the delivery task.
5. **Pickup**: Volunteer marks item as "Picked Up". 
   - Status updates to *On the Way* in dashboards.
6. **Delivery**: Recipient confirms receipt. 
   - Status updates to *Delivered*.
   - Recipient rates the volunteer.

### Authentication Flow
- **Login**: Returns Access and Refresh tokens.
- **Session**: Protected routes check token validity. Auto-refresh on 401 errors.
- **Logout**: 
  - Clears local storage.
  - **Redirects explicitly to the Home Page (`/`)**, ensuring no "login loop" occurs.

---

## Technology Stack

### Backend
- **Framework**: Django REST Framework (DRF)
- **Authentication**: `simplejwt` with custom claims
- **Documentation**: Swagger/OpenAPI
- **Testing**: `pytest` / Django Test Suite

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Context API + Custom Hooks (`useAuth`)
- **Routing**: `react-router-dom` v6 with Protected Routes

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/shafiullahshafin/ShareEat.git
   cd shareeat
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/api`
   - Admin Panel: `http://localhost:8000/admin`

---

## API Documentation

Interactive API documentation is available when running the backend:
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
