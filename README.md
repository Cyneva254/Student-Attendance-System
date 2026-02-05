# Student-Attendance-System

A modern, location-based attendance system using Firebase Realtime Database. This system ensures accurate attendance by verifying students are physically present within 30 meters of their teacher.

## 🎯 Features

- **📍 Location-Based Verification**: Students must be within 30m of the teacher to sign attendance
- **📱 QR Code Access**: Teachers generate a QR code that students can scan to access the attendance page
- **📸 Photo Upload**: Optional student photo upload for identity verification
- **⚡ Real-Time Updates**: Instant attendance tracking with live student count
- **🔔 Notifications**: Desktop notifications when students sign in
- **🎨 Modern UI**: Responsive design that works on all devices

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Storage**: Firebase Cloud Storage (for photos)
- **Libraries**: QRCode.js for QR code generation

## 📁 Project Structure

```
Student-Attendance-System/
├── index.html               # Landing page (role selection)
├── vercel.json              # Vercel deployment config
├── netlify.toml             # Netlify deployment config
├── .env                     # Environment variables (DO NOT COMMIT)
├── .gitignore               # Git ignore file
├── README.md                # This file
└── src/
    ├── Index.html           # Teacher portal page
    ├── Student.html         # Student attendance page
    ├── config.js            # Firebase configuration (loads from env vars)
    ├── config.local.js      # Local dev credentials (DO NOT COMMIT)
    ├── config.local.example.js  # Template for local config
    ├── Teacher.js           # Teacher portal logic
    ├── Student.js           # Student attendance logic
    └── style.css            # Shared styles
```

## 🚀 Getting Started

### Prerequisites

- A Firebase project with Realtime Database and Storage enabled
- A web browser with geolocation support
- A local development server (e.g., VS Code Live Server, Python http.server)

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/Cyneva254/Student-Attendance-System.git
   cd Student-Attendance-System
   ```

2. **Configure Firebase for Local Development**

   Copy the example config and add your credentials:

   ```bash
   cp src/config.local.example.js src/config.local.js
   ```

   Edit `src/config.local.js` with your Firebase credentials:

   ```javascript
   window.FIREBASE_API_KEY = "your-actual-api-key";
   window.FIREBASE_AUTH_DOMAIN = "your-project.firebaseapp.com";
   window.FIREBASE_PROJECT_ID = "your-project-id";
   window.FIREBASE_STORAGE_BUCKET = "your-project.appspot.com";
   window.FIREBASE_MESSAGING_SENDER_ID = "your-sender-id";
   window.FIREBASE_APP_ID = "your-app-id";
   window.FIREBASE_DATABASE_URL =
     "https://your-project-default-rtdb.firebaseio.com";
   ```

   ⚠️ **Important**: `config.local.js` is gitignored and will NOT be committed.

3. **Set up Firebase Security Rules**

   For Realtime Database:

   ```json
   {
     "rules": {
       "attendance": {
         "session": {
           ".read": true,
           ".write": true
         },
         "students": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

   For Storage (if using photo upload):

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /students/{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   ⚠️ **Note**: These rules are for development only. For production, implement proper authentication.

4. **Run a local server**

   Using VS Code Live Server:
   - Install the "Live Server" extension
   - Right-click on `index.html` (root) → "Open with Live Server"

   Using Python:

   ```bash
   python -m http.server 8000
   ```

   Then open `http://localhost:8000`

## 🚀 Deployment

### Environment Variables for Deployment

Set these environment variables in your deployment platform (Vercel/Netlify dashboard):

| Variable                       | Description                    |
| ------------------------------ | ------------------------------ |
| `FIREBASE_API_KEY`             | Your Firebase API key          |
| `FIREBASE_AUTH_DOMAIN`         | Firebase auth domain           |
| `FIREBASE_PROJECT_ID`          | Firebase project ID            |
| `FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket        |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID   |
| `FIREBASE_APP_ID`              | Firebase app ID                |
| `FIREBASE_DATABASE_URL`        | Firebase Realtime Database URL |

### Deploy to Vercel

1. **Set Environment Variables**
   - Go to your project settings on [vercel.com](https://vercel.com)
   - Navigate to Settings → Environment Variables
   - Add all Firebase variables listed above

2. **Deploy via CLI**

   ```bash
   npm install -g vercel
   vercel
   ```

   Or connect your GitHub repo for auto-deploy.

3. **Access your app**
   - Landing page: `https://your-app.vercel.app`
   - Teacher portal: `https://your-app.vercel.app/teacher`
   - Student portal: `https://your-app.vercel.app/student`

### Deploy to Netlify

1. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add all Firebase variables listed above

2. **Via Netlify Dashboard**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Leave build settings empty (static site)
   - Click "Deploy"

3. **Via Netlify CLI**

   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

4. **Access your app**
   - Landing page: `https://your-app.netlify.app`
   - Teacher portal: `https://your-app.netlify.app/teacher`
   - Student portal: `https://your-app.netlify.app/student`

### Post-Deployment Checklist

- [ ] Set all Firebase environment variables in deployment platform
- [ ] Update Firebase authorized domains in Firebase Console
- [ ] Restrict API keys in Google Cloud Console to your domain
- [ ] Test QR code scanning on mobile devices
- [ ] Verify geolocation works on HTTPS (required for production)

## 📖 How to Use

### For Teachers

1. Open the app and select **"Teacher Portal"**
2. Allow location access when prompted
3. Click **"Open Attendance"** to start a session
4. Share the QR code with students (they scan it with their phones)
5. Monitor students signing in real-time
6. Click **"Close Attendance"** when done
7. Use **"Clear Records"** to reset for a new session

### For Students

1. Scan the QR code provided by your teacher OR select **"Student Portal"**
2. Enter your name
3. (Optional) Upload a profile photo
4. Allow location access
5. Click **"Sign Attendance"**
6. If within 30m of the teacher, attendance is recorded ✅

## 🔒 Security Considerations

1. **API Keys**: While Firebase API keys are designed for client-side use, always:
   - Restrict your API key in Google Cloud Console
   - Set up proper Firebase Security Rules
   - Enable Firebase App Check for production

2. **Location Spoofing**: Be aware that GPS can be spoofed. Consider additional verification for high-security scenarios.

3. **Authentication**: For production use, implement Firebase Authentication to identify teachers and students.

## 🐛 Troubleshooting

| Issue                   | Solution                                  |
| ----------------------- | ----------------------------------------- |
| "No active session"     | Teacher needs to click "Open Attendance"  |
| "Too far from teacher"  | Student must be within 30m of teacher     |
| "Allow location access" | Enable location permissions in browser    |
| QR code not generating  | Check if QRCode library is loaded         |
| Firebase errors         | Verify Firebase config and security rules |

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Traditional attendance methods** such as roll-calling and paper registers are time-consuming, prone to errors, and allow proxy attendance. With the widespread use of smartphones and internet connectivity, this system provides a smarter, faster, and more secure attendance solution.
