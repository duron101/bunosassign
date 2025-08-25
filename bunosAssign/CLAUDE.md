# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Bonus Simulation System** (奖金模拟系统) built with Vue 3 frontend and Node.js backend. The system implements a "Profit Contribution + Position Value + Performance" three-dimensional model for bonus allocation with simulation capabilities.

### Technology Stack
- **Frontend**: Vue 3 + TypeScript + Element Plus + Pinia + VXE-Table + ECharts
- **Backend**: Node.js + Express + Sequelize + MySQL + JWT + Swagger  
- **Database**: MySQL 8.0 with optional SQLite/NeDB for development
- **Testing**: Jest (backend), Playwright (E2E frontend)
- **Deployment**: Docker Compose with MySQL and Redis

## Development Commands

### Setup (First Time)
```bash
# Run setup script (Windows)
./scripts/dev-setup.bat

# Or manual setup:
cd backend && npm install
cd ../frontend && npm install
mysql -u root -p < database/init.sql
```

### Development
```bash
# Start both services (Windows)
./scripts/dev-start.bat

# Or start individually:
cd backend && npm run dev      # Backend on :3000
cd frontend && npm run dev     # Frontend on :8080 (Vite)
```

### Backend Commands
```bash
cd backend
npm run dev          # Development with nodemon
npm start           # Production
npm test            # Jest tests
npm run lint        # ESLint
npm run format      # Prettier
```

### Frontend Commands
```bash
cd frontend
npm run dev         # Vite dev server on :8080 (configured in vite.config.ts)
npm run build       # Production build to dist/
npm run preview     # Preview production build
npm run lint        # ESLint with auto-fix
npm run format      # Prettier
npm run type-check  # Vue TypeScript check
```

### Testing Commands
```bash
# Backend Tests (Jest)
cd backend && npm test

# Frontend E2E Tests (Playwright)
cd frontend
npx playwright test                    # Run all tests
npx playwright test --ui              # Run tests with UI
npx playwright test tests/auth        # Run specific test suite
npx playwright show-report             # View test report
```

### Docker Commands
```bash
docker-compose up -d        # Start all services
docker-compose ps          # Check service status
docker-compose logs -f     # View logs
docker-compose down        # Stop services
```

## Architecture

### Three-Tier Architecture
1. **Frontend (Vue 3)**: Modern SPA with Element Plus UI components
2. **Backend (Node.js)**: RESTful API with Express and Sequelize ORM
3. **Database (MySQL)**: Relational database with comprehensive schema

### Key Business Logic
The system implements complex bonus calculation based on:
- **Profit Contribution**: Company-wide profit allocation
- **Position Value**: Role-based benchmark values  
- **Performance Assessment**: Individual performance coefficients

### Development Database Options
The backend supports multiple database configurations (see `backend/src/config/devConfig.js`):
- **Production**: MySQL via Sequelize ORM
- **Development**: SQLite files in `database/` and `backend/database/` 
- **Mock Data**: NeDB for lightweight testing without full database setup

### Core Modules
- **User Authentication**: JWT-based with RBAC (Role-Based Access Control)
- **Employee Management**: CRUD operations with department/position hierarchy
- **Bonus Calculation Engine**: Three-dimensional calculation algorithms
- **Simulation Analysis**: What-if scenarios and parameter adjustments
- **Reporting**: Multi-dimensional reports with charts and exports

### Database Schema Highlights
- **Users & Roles**: RBAC permission system
- **Organizational Structure**: Departments, positions, business lines
- **Employee Records**: Basic info, performance history, bonus records
- **Bonus Pools**: Period-based allocation with line-specific weights
- **Calculation Results**: Detailed breakdown of bonus computations

## File Structure Patterns

### Backend (`/backend/src/`)
- `controllers/`: HTTP request handlers (authController.js, employeeController.js, etc.)
- `models/`: Sequelize models (Employee.js, BonusPool.js, etc.)
- `routes/`: Express route definitions
- `services/`: Business logic (bonusAllocationService.js, calculationService.js)
- `middlewares/`: Auth, error handling, logging
- `config/`: Database and server configuration

### Frontend (`/frontend/src/`)
- `views/`: Page components organized by feature
- `components/`: Reusable UI components (layout, form, table, charts)
- `api/`: HTTP client functions for backend communication
- `store/`: Pinia state management modules
- `router/`: Vue Router configuration
- `types/`: TypeScript type definitions

## Testing Approach

### Backend Testing
- **Unit Tests**: Jest for services and utilities
- **Integration Tests**: API endpoint testing with supertest
- Located in `/backend/src/tests/`
- Run with: `cd backend && npm test`

### Frontend Testing
- **E2E Tests**: Playwright tests for user workflows
- **Test Suites**: auth, basic-management, bonus, simulation
- Test files in `/frontend/tests/`
- **Type Checking**: Vue TypeScript compiler (`npm run type-check`)
- Run with: `cd frontend && npx playwright test`

## API Documentation

- **Swagger UI**: Available at `http://localhost:3000/api/docs` in development
- **Authentication**: JWT tokens with refresh mechanism
- **Key Endpoints**:
  - `/api/auth/*` - Authentication
  - `/api/users/*` - User management
  - `/api/employees/*` - Employee CRUD
  - `/api/bonus-pools/*` - Bonus pool management
  - `/api/calculations/*` - Bonus calculations

## Security Considerations

- **Authentication**: JWT with secure token handling
- **Authorization**: Role-based permissions at route level
- **Data Protection**: Sensitive salary data requires appropriate permissions
- **Audit Logging**: Operation logs for critical actions

## Development Workflow

### Quick Start (Windows)
```bash
# Setup and install dependencies
./scripts/dev-setup.bat

# Start both frontend and backend
./scripts/dev-start.bat

# Stop all services
./scripts/dev-stop.bat
```

### Manual Setup
1. **Database**: Ensure MySQL is running and schema is initialized
   - For development: SQLite databases are auto-created in `database/` directory
   - For production: Run `mysql -u root -p < database/init.sql`
2. **Backend**: Start with `npm run dev` for auto-reload (port 3000)
3. **Frontend**: Start Vite dev server with `npm run dev` (port 8080)
4. **Default Login**: admin/admin123 for testing

### Data Management Scripts
```bash
# Import sample data
./scripts/import-to-database.bat   # Import to MySQL
./scripts/import-to-nedb.bat        # Import to NeDB (development)

# Initialize basic data
node scripts/init-basic-data.js

# Test database connection
node scripts/test-db-connection.js
```

## Performance Notes

- **Large Datasets**: Bonus calculations designed for up to 1000+ employees
- **Caching**: Redis optional for performance optimization
- **Async Processing**: Complex calculations may use background jobs

## Key API Routes

### Authentication & Users
- `POST /api/auth/login` - User login (returns JWT tokens)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users` - List users (requires admin role)
- `POST /api/users` - Create user

### Core Business Entities  
- `/api/employees/*` - Employee management
- `/api/departments/*` - Department hierarchy
- `/api/positions/*` - Position and benchmark values
- `/api/business-lines/*` - Business line weights

### Bonus Calculation
- `/api/bonus-pools/*` - Bonus pool configuration
- `/api/calculations/three-dimensional` - Three-dimensional calculation
- `/api/simulations/*` - Simulation scenarios

## Documentation References

- **README.md**: Comprehensive project documentation (Chinese)
- **prd.md**: Detailed product requirements (Chinese)
- **design.md**: Excel template design specifications
- **database/init.sql**: Complete database schema
- **PRODUCTION_DEPLOY.md**: Production deployment guide
- **TODO.md**: Feature development status tracker