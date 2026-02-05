/**
 * Teacher Attendance Portal Script
 * Handles attendance session management, QR code generation, and real-time student tracking
 */

// DOM Elements
const status = document.getElementById("status");
const studentList = document.getElementById("studentList");
const qrCodeDiv = document.getElementById("qrCode");
const totalCount = document.getElementById("totalCount");

// Teacher's location
let teacherLat, teacherLng;

/**
 * Start a new attendance session
 * Records teacher's location and opens the session for students
 */
function startAttendance() {
  if (!navigator.geolocation) {
    status.textContent = "Geolocation not supported! ❌";
    return;
  }

  status.textContent = "Getting your location... 📍";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      teacherLat = position.coords.latitude;
      teacherLng = position.coords.longitude;

      database
        .ref("attendance/session")
        .set({
          teacherLat: teacherLat,
          teacherLng: teacherLng,
          timestamp: Date.now(),
          active: true,
        })
        .then(() => {
          status.textContent = `Attendance open! Location recorded (${teacherLat.toFixed(4)}, ${teacherLng.toFixed(4)}) ✅`;
          generateQRCode();
        })
        .catch((error) => {
          console.error("Error starting session:", error);
          status.textContent = "Error starting attendance session. ❌";
        });
    },
    (error) => {
      console.error("Geolocation error:", error);
      status.textContent = "Allow location access to start attendance! ❌";
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

/**
 * Close the current attendance session
 */
function closeAttendance() {
  database
    .ref("attendance/session")
    .update({ active: false })
    .then(() => {
      status.textContent = "Attendance closed ✅";
      qrCodeDiv.innerHTML =
        '<p style="color: #666;">Session closed. Start a new attendance to generate QR code.</p>';
    })
    .catch((error) => {
      console.error("Error closing session:", error);
      status.textContent = "Error closing attendance. ❌";
    });
}

/**
 * Clear all attendance records (for new session)
 */
function clearAttendance() {
  if (confirm("Are you sure you want to clear all attendance records?")) {
    database
      .ref("attendance/students")
      .remove()
      .then(() => {
        status.textContent = "Attendance records cleared ✅";
      })
      .catch((error) => {
        console.error("Error clearing attendance:", error);
        status.textContent = "Error clearing records. ❌";
      });
  }
}

/**
 * Generate QR code for student page
 */
function generateQRCode() {
  // Get the base URL (works for both local and deployed environments)
  const baseUrl = window.location.origin;
  const pathname = window.location.pathname;

  // Determine the student URL based on the current path
  let studentUrl;

  if (pathname.includes("/src/")) {
    // Local development or direct file access
    studentUrl =
      baseUrl +
      pathname
        .replace(/Index\.html$/i, "Student.html")
        .replace(/teacher\.html$/i, "Student.html");
  } else if (pathname === "/teacher" || pathname === "/teacher/") {
    // Clean URL route (Vercel/Netlify)
    studentUrl = baseUrl + "/student";
  } else {
    // Fallback: assume we're at root or similar
    studentUrl = baseUrl + "/src/Student.html";
  }

  QRCode.toCanvas(
    studentUrl,
    { width: 200, margin: 2 },
    function (error, canvas) {
      if (error) {
        console.error("QR Code error:", error);
        qrCodeDiv.innerHTML =
          '<p style="color: red;">Error generating QR code</p>';
        return;
      }
      qrCodeDiv.innerHTML = "";
      qrCodeDiv.appendChild(canvas);

      // Add URL text below QR code
      const urlText = document.createElement("p");
      urlText.style.fontSize = "12px";
      urlText.style.color = "#666";
      urlText.textContent = studentUrl;
      qrCodeDiv.appendChild(urlText);
    },
  );
}

/**
 * Real-time listener for student attendance
 * Updates the student list and count as students sign in
 */
database.ref("attendance/students").on("value", (snapshot) => {
  studentList.innerHTML = "";
  const students = snapshot.val();
  let count = 0;

  if (students) {
    Object.values(students).forEach((student) => {
      count++;
      const li = document.createElement("li");
      const time = new Date(student.timestamp).toLocaleTimeString();

      // Check if student has a photo
      if (student.photoURL) {
        li.innerHTML = `
          <img src="${student.photoURL}" alt="${student.name}" 
               width="40" height="40" 
               style="border-radius:50%; vertical-align:middle; margin-right:10px; object-fit:cover;">
          <strong>${student.name}</strong> — Signed at ${time}
        `;
      } else {
        li.innerHTML = `
          <span style="display:inline-block; width:40px; height:40px; background:#ccc; 
                       border-radius:50%; vertical-align:middle; margin-right:10px; 
                       text-align:center; line-height:40px; font-size:18px;">
            ${student.name.charAt(0).toUpperCase()}
          </span>
          <strong>${student.name}</strong> — Signed at ${time}
        `;
      }
      studentList.appendChild(li);
    });
  }

  totalCount.textContent = count;
});

/**
 * Real-time notification for new attendance
 */
let isFirstLoad = true;
database.ref("attendance/students").on("child_added", (snapshot) => {
  // Skip notifications on initial load
  if (isFirstLoad) {
    return;
  }

  const student = snapshot.val();
  // Show notification
  if (Notification.permission === "granted") {
    new Notification("New Attendance", {
      body: `${student.name} has signed attendance`,
      icon: student.photoURL || null,
    });
  } else {
    // Fallback to alert (can be annoying, so you might want to remove this)
    console.log(`📢 New attendance: ${student.name}`);
  }
});

// Mark initial load complete after fetching existing data
database.ref("attendance/students").once("value", () => {
  isFirstLoad = false;
});

// Request notification permission on page load
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// Check and display current session status on load
database
  .ref("attendance/session")
  .get()
  .then((snapshot) => {
    if (snapshot.exists()) {
      const session = snapshot.val();
      if (session.active) {
        status.textContent = "Attendance session is currently OPEN ✅";
        generateQRCode();
      } else {
        status.textContent =
          "No active attendance session. Click 'Open Attendance' to start.";
      }
    } else {
      status.textContent =
        "No attendance session found. Click 'Open Attendance' to start.";
    }
  });
