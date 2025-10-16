# CanLifeHub

Canadian Lifestyle Sharing Platform

## Project Structure

### `frontend/` (React Native)
- `assets/` – Static resources like images and fonts.
- `components/` – Reusable UI components (buttons, cards, etc.).
- `components/LoginForm.js` – Login form component.
- `screens/` – Main app screens (Login, Home, Post, etc.).
- `navigation/` – Navigation configuration using React Navigation.
- `store/` – State management logic (e.g., Redux or Zustand).
- `utils/` – Common utilities and constants.
- `App.js` – Main entry point of the application.

### `backend/` (Node.js + Express)
- `controllers/` – Business logic handlers (e.g., userController.js).
- `routes/` – Express route definitions.
- `routes/auth.js` – Authentication routes.
- `models/` – Mongoose schemas (User, Post, etc.).
- `models/User.js` – User schema.
- `middleware/` – JWT authentication and other middlewares.
- `services/` – Integration with external services (Firebase, S3).
- `config/` – Configuration for environment and database.
- `tests/` – Automated test cases.
- `server.js` – Backend entry point with basic routing.
- `.env.example` – Example environment variable file.

### `shared/`
- `docs/` – Documentation such as design specs.
- `design/` – Design assets (UI prototypes, architecture diagrams).
- `api-specs/` – API documentation like Swagger/OpenAPI.
