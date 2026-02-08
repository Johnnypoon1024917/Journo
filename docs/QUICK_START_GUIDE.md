# Quick Start Guide

**For**: New developers joining the Journo project  
**Time**: 15 minutes to get started

## 🚀 Get Running in 5 Steps

### 1. Clone and Install (3 min)
```bash
# Clone the repository
git clone <repository-url>
cd Journo

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment (2 min)
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend configuration
cd ../frontend
cp .env.example .env
# Edit .env with API URL (default: http://localhost:5000/api)
```

### 3. Set Up Database (3 min)
```bash
cd backend

# Run migrations
npm run migrate

# Verify database
npm run verify-db
```

### 4. Start Development Servers (2 min)
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Backend runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### 5. Test the Application (5 min)
1. Open http://localhost:3000
2. Click "Sign in"
3. Use test credentials from `LOGIN_TEST_CREDENTIALS.md`
4. Explore the application!

## 📚 Essential Reading

### Must Read (15 min)
1. **[README.md](../README.md)** - Project overview (5 min)
2. **[CURRENT_PROJECT_STATUS.md](./CURRENT_PROJECT_STATUS.md)** - Current state (10 min)

### Should Read (30 min)
3. **[UI_REDESIGN_PREPARATION.md](./UI_REDESIGN_PREPARATION.md)** - Redesign guide (20 min)
4. **[Documentation Index](./README.md)** - Doc navigation (10 min)

### Nice to Have (1 hour)
5. **Recent Fixes** - `docs/fixes/` folder
6. **Historical Context** - `docs/archive/` folder

## 🎯 Your First Tasks

### Day 1: Orientation
- [ ] Get the app running locally
- [ ] Read essential documentation
- [ ] Explore the codebase structure
- [ ] Review current features
- [ ] Join team communication channels

### Day 2: Deep Dive
- [ ] Review design system (`frontend/src/design-system/`)
- [ ] Understand component structure
- [ ] Review API endpoints
- [ ] Read recent fixes documentation
- [ ] Set up development tools

### Day 3: First Contribution
- [ ] Pick a small task or bug
- [ ] Create a feature branch
- [ ] Make your changes
- [ ] Write tests
- [ ] Submit a pull request

## 🛠️ Development Tools

### Required
- **Node.js 20+** - Runtime environment
- **PostgreSQL 14+** - Database
- **Git** - Version control
- **Code Editor** - VS Code recommended

### Recommended
- **Postman** - API testing
- **pgAdmin** - Database management
- **React DevTools** - Browser extension
- **Redux DevTools** - State inspection

### Optional
- **Docker** - Containerization
- **Redis** - Caching (for production features)

## 📁 Key Directories

### Frontend
```
frontend/src/
├── components/      # React components (START HERE)
├── pages/           # Page components
├── services/        # API services
├── stores/          # State management
├── hooks/           # Custom hooks
├── types/           # TypeScript types
├── utils/           # Utility functions
└── design-system/   # Design system
```

### Backend
```
backend/src/
├── controllers/     # Request handlers
├── services/        # Business logic (START HERE)
├── routes/          # API routes
├── middleware/      # Express middleware
├── models/          # Database models
└── migrations/      # Database migrations
```

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# Watch mode
npm test -- --watch
```

### Test Credentials
See `LOGIN_TEST_CREDENTIALS.md` for:
- Admin account
- Regular user account
- Test data

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/journo
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Rebuild TypeScript
npm run build

# Check for type errors
npm run type-check
```

## 💡 Pro Tips

### Development Workflow
1. **Always pull latest** before starting work
2. **Create feature branches** for new work
3. **Write tests** for new features
4. **Update documentation** when needed
5. **Run linter** before committing

### Code Quality
```bash
# Lint your code
npm run lint

# Format your code
npm run format

# Type check
npm run type-check
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit with meaningful messages
git commit -m "feat: add user profile page"

# Push and create PR
git push origin feature/your-feature-name
```

## 🔗 Useful Links

### Documentation
- [Current Status](./CURRENT_PROJECT_STATUS.md)
- [UI Redesign Guide](./UI_REDESIGN_PREPARATION.md)
- [Documentation Index](./README.md)

### External Resources
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Project Resources
- Main README: `../README.md`
- Test Credentials: `../LOGIN_TEST_CREDENTIALS.md`
- Backend README: `../backend/README.md`

## 🆘 Getting Help

### When Stuck
1. Check this guide
2. Review documentation in `docs/`
3. Search the codebase for examples
4. Ask the team

### Before Asking
- Have you read the relevant documentation?
- Have you searched for similar issues?
- Can you provide a minimal reproduction?
- What have you tried so far?

## ✅ Checklist

### Setup Complete When:
- [ ] Backend runs without errors
- [ ] Frontend runs without errors
- [ ] Can login with test credentials
- [ ] Can create a test trip
- [ ] Tests pass
- [ ] No TypeScript errors

### Ready to Contribute When:
- [ ] Understand project structure
- [ ] Read essential documentation
- [ ] Familiar with tech stack
- [ ] Know how to run tests
- [ ] Understand git workflow

## 🎉 Welcome to the Team!

You're now ready to start contributing to Journo. Remember:
- **Ask questions** - No question is too small
- **Read the docs** - Most answers are documented
- **Write tests** - Quality over speed
- **Have fun** - We're building something great!

---

**Need Help?** Check the team chat or create an issue on GitHub.  
**Found a Bug?** Document it in `docs/fixes/` after fixing.  
**Have an Idea?** Share it with the team!

Happy coding! 🚀
