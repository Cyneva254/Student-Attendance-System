/**
 * Teacher Attendance Portal
 * Handles attendance session management, QR code generation, and real-time student tracking
 */

// Wait for Firebase to initialize
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase services
  const database = firebase.database();
  const storage = firebase.storage();

  // Make database available globally for inline onclick handlers
  window.database = database;

  // DOM Elements
  const status = document.getElementById("status");
  const studentList = document.getElementById("studentList");
  const qrCodeDiv = document.getElementById("qrCode");
  const totalCount = document.getElementById("totalCount");

  // Teacher's location
  let teacherLat, teacherLng;

  /**
   * Start a new attendance session
   */
  window.startAttendance = function () {
    if (!navigator.geolocation) {
      status.textContent = "Geolocation not supported by your browser! ❌";
      status.className = "status-message status-error";
      return;
    }

    status.textContent = "Getting your location... 📍";
    status.className = "status-message status-warning";

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
            status.textContent = `Attendance OPEN! Location: (${teacherLat.toFixed(4)}, ${teacherLng.toFixed(4)}) ✅`;
            status.className = "status-message status-success";
            generateQRCode();
          })
          .catch((error) => {
            console.error("Error starting session:", error);
            status.textContent =
              "Error starting attendance session. Check console. ❌";
            status.className = "status-message status-error";
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Location error: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Position unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg += "Request timed out.";
            break;
          default:
            errorMsg += "Unknown error.";
        }
        status.textContent = errorMsg + " ❌";
        status.className = "status-message status-error";
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  /**
   * Close the current attendance session
   */
  window.closeAttendance = function () {
    database
      .ref("attendance/session")
      .update({ active: false })
      .then(() => {
        status.textContent = "Attendance CLOSED ✅";
        status.className = "status-message status-warning";
        qrCodeDiv.innerHTML =
          '<p class="qr-placeholder">Session closed. Click "Open Attendance" to start a new session.</p>';
      })
      .catch((error) => {
        console.error("Error closing session:", error);
        status.textContent = "Error closing attendance. ❌";
        status.className = "status-message status-error";
      });
  };

  /**
   * Clear all attendance records
   */
  window.clearAttendance = function () {
    if (
      confirm(
        "Are you sure you want to clear ALL attendance records? This cannot be undone.",
      )
    ) {
      database
        .ref("attendance/students")
        .remove()
        .then(() => {
          status.textContent = "All attendance records cleared ✅";
          status.className = "status-message status-success";
        })
        .catch((error) => {
          console.error("Error clearing attendance:", error);
          status.textContent = "Error clearing records. ❌";
          status.className = "status-message status-error";
        });
    }
  };

  /**
   * Generate QR code for student page
   */
  function generateQRCode() {
    // Build the student URL
    const baseUrl = window.location.origin;
    const studentUrl = baseUrl + "/student.html";

    console.log("Generating QR for URL:", studentUrl);

    // Clear previous QR code
    qrCodeDiv.innerHTML = "";

    // Create container for QR code
    const qrContainer = document.createElement("div");
    qrContainer.id = "qrCodeCanvas";
    qrCodeDiv.appendChild(qrContainer);

    // Generate QR code using QRCode.js library
    try {
      new QRCode(qrContainer, {
        text: studentUrl,
        width: 200,
        height: 200,
        colorDark: "#2a4d8f",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });

      // Add URL text below QR code
      const urlText = document.createElement("p");
      urlText.className = "qr-url";
      urlText.textContent = studentUrl;
      qrCodeDiv.appendChild(urlText);

      console.log("QR Code generated successfully!");
    } catch (error) {
      console.error("QR Code generation error:", error);
      qrCodeDiv.innerHTML =
        '<p style="color: red;">Error generating QR code. Please try again.</p>';
    }
  }

  /**
   * Real-time listener for student attendance
   */
  database.ref("attendance/students").on("value", (snapshot) => {
    studentList.innerHTML = "";
    const students = snapshot.val();
    let count = 0;

    if (students) {
      // Convert to array and sort by timestamp (newest first)
      const studentsArray = Object.entries(students)
        .map(([key, value]) => ({
          id: key,
          ...value,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      studentsArray.forEach((student) => {
        count++;
        const li = document.createElement("li");
        const time = new Date(student.timestamp).toLocaleTimeString();
        const date = new Date(student.timestamp).toLocaleDateString();

        if (student.photoURL) {
          li.innerHTML = `
            <img src="${student.photoURL}" alt="${student.name}" class="student-avatar">
            <div class="student-info">
              <div class="student-name">${student.name}</div>
              ${student.regNumber ? `<div class="student-reg">Reg: ${student.regNumber}</div>` : ""}
              <div class="student-time">Signed at ${time} on ${date}</div>
            </div>
          `;
        } else {
          li.innerHTML = `
            <div class="student-avatar-placeholder">
              ${student.name.charAt(0).toUpperCase()}
            </div>
            <div class="student-info">
              <div class="student-name">${student.name}</div>
              ${student.regNumber ? `<div class="student-reg">Reg: ${student.regNumber}</div>` : ""}
              <div class="student-time">Signed at ${time} on ${date}</div>
            </div>
          `;
        }
        studentList.appendChild(li);
      });
    }

    totalCount.textContent = count;

    if (count === 0) {
      studentList.innerHTML =
        '<li style="text-align: center; color: #666;">No students have signed yet</li>';
    }
  });

  /**
   * Notification for new attendance (skip initial load)
   */
  let isFirstLoad = true;
  database.ref("attendance/students").on("child_added", (snapshot) => {
    if (isFirstLoad) return;

    const student = snapshot.val();
    console.log(`📢 New attendance: ${student.name}`);

    // Browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Attendance", {
        body: `${student.name} has signed attendance`,
        icon: student.photoURL || "/favicon.ico",
      });
    }
  });

  // Mark initial load complete
  database.ref("attendance/students").once("value", () => {
    setTimeout(() => {
      isFirstLoad = false;
    }, 1000);
  });

  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  /**
   * Check current session status on page load
   */
  database
    .ref("attendance/session")
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        const session = snapshot.val();
        if (session.active) {
          status.textContent = "Attendance session is currently OPEN ✅";
          status.className = "status-message status-success";
          teacherLat = session.teacherLat;
          teacherLng = session.teacherLng;
          generateQRCode();
        } else {
          status.textContent =
            "Attendance is CLOSED. Click 'Open Attendance' to start a new session.";
          status.className = "status-message status-warning";
        }
      } else {
        status.textContent =
          "No attendance session found. Click 'Open Attendance' to start.";
        status.className = "status-message";
      }
    })
    .catch((error) => {
      console.error("Error checking session:", error);
      status.textContent = "Error connecting to database. Please refresh.";
      status.className = "status-message status-error";
    });

  console.log("Teacher portal loaded successfully ✅");
});
