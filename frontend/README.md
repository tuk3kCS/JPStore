# JPStore Frontend

React.js frontend for the JPStore e-commerce application.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.template .env
```

4. Update the environment variables in `.env` if needed.

### Running the Application

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

### Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable components
│   └── layout/         # Layout components
├── context/            # React Context providers
├── services/           # API service functions
├── utils/              # Utility functions
├── App.js              # Main App component
└── index.js            # Entry point
```

### API Integration

The frontend communicates with the backend API running on `http://localhost:5000/api` by default. Make sure the backend server is running before starting the frontend.

### Authentication

The app uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests. 