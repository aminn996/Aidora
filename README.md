# 🚀 Aidora - Service Marketplace Platform

> **Modern service booking platform with email notifications, Google OAuth, Facebook OAuth, and real-time booking management.**

## ✨ Features Implemented

### 🎯 Core Features
- ✅ User authentication (Email/Password)
- ✅ Google Sign-In (auto-create/auto-link accounts)
- ✅ Facebook Sign-In (auto-create/auto-link accounts)
- ✅ Service browsing and search
- ✅ Booking management with time slots
- ✅ Provider dashboard with real-time bookings
- ✅ Admin panel for platform management
- ✅ Role-based access (Customer/Provider/Admin)

### 📧 Email Notifications (NEW)
- ✅ New booking notification (to provider)
- ✅ Booking confirmation email (to customer)
- ✅ Booking decline notification (to customer)
- ✅ Professional HTML templates
- ✅ Non-blocking (doesn't interrupt bookings)

### 🔐 Authentication (ENHANCED)
- ✅ Traditional email/password login
- ✅ Google OAuth (sign in with Google)
- ✅ Facebook OAuth (sign in with Facebook)
- ✅ Auto-account creation
- ✅ Account linking (same email = same account)
- ✅ JWT token-based sessions

---

## 📁 Project Structure

```
aidora/
├── backend/                    # Express.js API
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── email.js           # Email configuration (NEW)
│   │   └── passport.js        # OAuth strategies (UPDATED)
│   ├── controllers/
│   │   ├── authController.js  # Authentication
│   │   ├── bookingController.js # Bookings + emails (UPDATED)
│   │   ├── serviceController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js            # Updated with OAuth fields
│   │   ├── Booking.js
│   │   └── Service.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── services.js
│   │   └── admin.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── error.js
│   ├── .env.example           # Environment template (NEW)
│   ├── server.js              # Express setup (UPDATED)
│   └── package.json           # Dependencies (UPDATED)
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx      # OAuth buttons
│   │   │   ├── Bookings.jsx   # Customer bookings
│   │   │   └── ServiceDetails.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ProviderDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── services/
│   │       └── api.js         # API configuration
│   ├── .env.example           # Environment template (UPDATED)
│   └── package.json
│
├── 📚 DOCUMENTATION (NEW)
│   ├── QUICK_START_CHECKLIST.md      # Start here! (5 min read)
│   ├── QUICK_REFERENCE.md            # 2-min setup guide
│   ├── EMAIL_OAUTH_SETUP.md          # Detailed setup (10 min)
│   ├── IMPLEMENTATION_CHECKLIST.md   # What's done + testing
│   ├── IMPLEMENTATION_SUMMARY.md     # Architecture & flows
│   └── DEPLOYMENT_GUIDE.md           # Production deployment
│
└── test-endpoints.js          # API testing script
```

---

## 🚀 Quick Start

### 1️⃣ Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account (free tier works)
- Gmail account (for email notifications)
- Google OAuth app credentials (free)
- Facebook app credentials (free)

### 2️⃣ Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd aidora

# Backend setup
cd backend
npm install
cp .env.example .env

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
```

### 3️⃣ Configure Environment Variables

**Backend (.env):**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aidora

# Server
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret

# JWT
JWT_SECRET=your-secret-key
```

**Frontend (.env):**
```env
VITE_API_BASE=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-app-id
```

### 4️⃣ Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev      # Starts on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev      # Starts on http://localhost:5173
```

### 5️⃣ Test the Flow

1. Go to http://localhost:5173
2. Click "Sign in with Google" or "Sign in with Facebook"
3. Create a booking
4. Check provider's email
5. Provider accepts booking
6. Check customer's email
7. ✅ Done!

---

## 📋 Setup Guides

**Choose based on your experience level:**

| Guide | Time | Audience |
|-------|------|----------|
| [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md) | 5 min | Everyone - Start here! |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 2 min | Quick setup checklist |
| [EMAIL_OAUTH_SETUP.md](EMAIL_OAUTH_SETUP.md) | 10 min | Detailed step-by-step |
| [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) | 15 min | Testing guide |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 20 min | Production deployment |

---

## 🎯 What Each Service Does

### 📧 Email Service
**File:** `backend/config/email.js`

Sends automated emails:
1. **New Booking** - Provider gets notified
   - Customer name, email, phone
   - Service details and price
   - Booking date/time
   - Link to dashboard

2. **Booking Confirmed** - Customer gets notified
   - Provider name and contact
   - Service details and price
   - Confirmed date/time
   - Reminder to be available

3. **Booking Declined** - Customer gets notified
   - Original booking details
   - Suggestion to try another provider
   - Browse services button

### 🔐 Authentication Service
**File:** `backend/config/passport.js`

Three authentication methods:
1. **Email/Password** - Traditional login
2. **Google OAuth** - Sign in with Google
3. **Facebook OAuth** - Sign in with Facebook

All three methods can link to the same account (by email).

### 🚀 API Endpoints

#### Authentication
```
POST   /api/auth/register           # Email/password signup
POST   /api/auth/login              # Email/password login
POST   /api/auth/google             # Google OAuth
POST   /api/auth/facebook           # Facebook OAuth
POST   /api/auth/forgot-password    # Password reset
POST   /api/auth/reset-password     # Reset with token
GET    /api/auth/me                 # Get current user
PUT    /api/auth/profile            # Update profile
PUT    /api/auth/change-password    # Change password
```

#### Bookings
```
POST   /api/bookings                # Create booking (sends email to provider)
GET    /api/bookings/:id            # Get booking details
GET    /api/bookings/user/my-bookings # Get my bookings
PUT    /api/bookings/:id/status     # Update status (sends email to customer)
PUT    /api/bookings/:id/cancel     # Cancel booking
```

#### Services
```
GET    /api/services                # List all services
GET    /api/services/:id            # Get service details
POST   /api/services                # Create service (provider)
PUT    /api/services/:id            # Update service (provider)
DELETE /api/services/:id            # Delete service (provider)
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign up with email/password
- [ ] Sign in with Google
- [ ] Sign in with Facebook
- [ ] Create booking
- [ ] Check provider email
- [ ] Provider accepts booking
- [ ] Check customer email
- [ ] Customer sees "Confirmed" status

### Automated Testing
```bash
# Run test endpoints
node test-endpoints.js
```

---

## 🔧 Tech Stack

### Backend
- **Framework:** Express.js 4.19
- **Database:** MongoDB 7.0 + Mongoose
- **Authentication:** 
  - JWT (jsonwebtoken)
  - Passport.js (local, Google OAuth, Facebook OAuth)
  - bcryptjs (password hashing)
- **Email:** Nodemailer 7.0 (Gmail SMTP)
- **Validation:** Joi 17.12
- **Security:**
  - helmet (security headers)
  - cors (cross-origin requests)
  - rate-limit (DDoS protection)
  - xss-clean (XSS protection)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **HTTP Client:** Axios
- **Notifications:** react-hot-toast
- **Icons:** react-icons

### DevOps
- **Package Manager:** npm
- **Dev Server:** Vite dev server
- **Code Quality:** ESlint ready
- **Node:** v16+ recommended

---

## 🔐 Security Features

- ✅ **Password Security:** bcryptjs hashing with salt rounds
- ✅ **JWT Tokens:** Secure token-based authentication
- ✅ **OAuth:** Google & Facebook handle auth securely
- ✅ **CORS:** Configured for specific origins
- ✅ **Rate Limiting:** Protects against brute force attacks
- ✅ **XSS Protection:** Sanitized inputs
- ✅ **Security Headers:** Helmet.js enabled
- ✅ **Email Verification:** Auto-verified for OAuth
- ✅ **Role-Based Access:** Customer/Provider/Admin roles

---

## 📊 Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (optional for OAuth),
  googleId: String (optional),
  facebookId: String (optional),
  role: "customer" | "provider" | "admin",
  profilePicture: String,
  isEmailVerified: Boolean,
  phone: String,
  city: String,
  address: String,
  preferences: {
    language, currency, timeZone, theme
  },
  notificationPreferences: {
    emailNotifications, smsNotifications, etc
  },
  providerProfile: {
    bio, skills, rating, etc
  }
}
```

### Booking
```javascript
{
  user: ObjectId (customer),
  provider: ObjectId (service provider),
  service: ObjectId,
  date: Date,
  slot: String,
  price: Number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  notes: String,
  payment: { status },
  platformFee: Number,
  providerEarning: Number
}
```

### Service
```javascript
{
  title: String,
  description: String,
  category: String,
  price: Number,
  provider: ObjectId,
  icon: String,
  isActive: Boolean,
  rating: Number,
  reviews: [{ user, rating, comment }]
}
```

---

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Production
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Vercel/Netlify (frontend)
- Heroku/Railway (backend)
- Environment setup
- OAuth configuration
- Email configuration
- Database scaling

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support & Troubleshooting

### Common Issues

**Email not sending?**
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Verify Gmail 2FA is enabled
- Generate new App Password

**Google OAuth not working?**
- Check VITE_GOOGLE_CLIENT_ID in frontend
- Verify authorized URIs in Google Console
- Check callback URL matches

**Facebook OAuth not working?**
- Check VITE_FACEBOOK_APP_ID in frontend
- Verify app domains in Facebook Console
- Check redirect URIs

**Booking fails?**
- Check all .env variables are set
- Verify backend is running
- Check browser console for errors

### Get Help
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Read [EMAIL_OAUTH_SETUP.md](EMAIL_OAUTH_SETUP.md)
- Review [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎉 Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Email Notifications | ✅ Complete | Gmail SMTP, 3 templates |
| Google OAuth | ✅ Complete | Auto-create, linking |
| Facebook OAuth | ✅ Complete | Auto-create, linking |
| User Authentication | ✅ Complete | Email, Google, Facebook |
| Service Booking | ✅ Complete | With time slots |
| Provider Dashboard | ✅ Complete | Real-time bookings |
| Customer Dashboard | ✅ Complete | Status tracking |
| Admin Panel | ✅ Complete | Platform management |
| Payment System | ✅ Complete | Fee calculation |
| Notifications | ✅ Complete | Email + UI toasts |

---

## 🚀 Next Steps

1. **Start here:** [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)
2. **Set up in 20 mins:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
3. **Deploy:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Made with ❤️ for service providers and customers**

Last Updated: December 24, 2025  
Status: ✅ Production Ready
