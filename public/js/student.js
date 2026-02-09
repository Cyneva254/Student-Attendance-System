/**
 * Student Attendance Script
 * Handles student attendance sign-in with geolocation verification and optional photo upload
 */

// Wait for Firebase to initialize
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase services
  const database = firebase.database();
  const storage = firebase.storage();

  // DOM Elements
  const status = document.getElementById("status");
  const studentNameInput = document.getElementById("studentName");
  const regNumberInput = document.getElementById("regNumber");
  const photoInput = document.getElementById("photo");

  /**
   * Sign attendance with location verification
   */
  window.signAttendance = function () {
    const name = studentNameInput.value.trim();
    const regNumber = regNumberInput.value.trim();
    const file = photoInput.files[0];

    // Validate inputs
    if (!name) {
      status.textContent = "Please enter your name! ❌";
      status.className = "status-message status-error";
      studentNameInput.focus();
      return;
    }

    if (!regNumber) {
      status.textContent = "Please enter your registration number! ❌";
      status.className = "status-message status-error";
      regNumberInput.focus();
      return;
    }

    // Check geolocation support
    if (!navigator.geolocation) {
      status.textContent = "Geolocation is not supported by your browser! ❌";
      status.className = "status-message status-error";
      return;
    }

    status.textContent = "Getting your location... 📍";
    status.className = "status-message status-warning";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const studentLat = position.coords.latitude;
        const studentLng = position.coords.longitude;

        status.textContent = "Checking attendance session... ⏳";

        // Check if there's an active session
        database
          .ref("attendance/session")
          .get()
          .then((snapshot) => {
            if (!snapshot.exists()) {
              status.textContent =
                "No active attendance session! Ask your teacher to open attendance. ❌";
              status.className = "status-message status-error";
              return;
            }

            const session = snapshot.val();

            if (!session.active) {
              status.textContent =
                "Attendance is CLOSED! The session has ended. ❌";
              status.className = "status-message status-error";
              return;
            }

            // Calculate distance from teacher
            const teacherLat = session.teacherLat;
            const teacherLng = session.teacherLng;
            const distance = getDistance(
              studentLat,
              studentLng,
              teacherLat,
              teacherLng,
            );

            console.log(`Distance from teacher: ${distance.toFixed(2)} meters`);

            // Check if within 30 meters
            if (distance > 30) {
              status.textContent = `You are too far from the teacher! Distance: ${Math.round(distance)}m (max 30m allowed) ❌`;
              status.className = "status-message status-error";
              return;
            }

            // Check for duplicate attendance
            checkDuplicateAndSign(
              name,
              regNumber,
              studentLat,
              studentLng,
              file,
              distance,
            );
          })
          .catch((error) => {
            console.error("Error checking session:", error);
            status.textContent =
              "Error checking attendance session. Please try again. ❌";
            status.className = "status-message status-error";
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Location error: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg +=
              "Permission denied. Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg +=
              "Position unavailable. Try again outside or near a window.";
            break;
          case error.TIMEOUT:
            errorMsg += "Request timed out. Please try again.";
            break;
          default:
            errorMsg += "Unknown error occurred.";
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
   * Check for duplicate attendance before signing
   */
  function checkDuplicateAndSign(
    name,
    regNumber,
    studentLat,
    studentLng,
    file,
    distance,
  ) {
    status.textContent = "Checking for existing attendance... ⏳";

    database
      .ref("attendance/students")
      .orderByChild("regNumber")
      .equalTo(regNumber)
      .once("value")
      .then((snapshot) => {
        if (snapshot.exists()) {
          status.textContent = `You have already signed attendance with registration number ${regNumber}! ⚠️`;
          status.className = "status-message status-warning";
          return;
        }

        // Proceed with signing
        if (file) {
          uploadPhotoAndSign(
            name,
            regNumber,
            studentLat,
            studentLng,
            file,
            distance,
          );
        } else {
          saveAttendance(
            name,
            regNumber,
            studentLat,
            studentLng,
            null,
            distance,
          );
        }
      })
      .catch((error) => {
        console.error("Error checking duplicate:", error);
        // Proceed anyway if check fails
        if (file) {
          uploadPhotoAndSign(
            name,
            regNumber,
            studentLat,
            studentLng,
            file,
            distance,
          );
        } else {
          saveAttendance(
            name,
            regNumber,
            studentLat,
            studentLng,
            null,
            distance,
          );
        }
      });
  }

  /**
   * Upload photo to Firebase Storage then save attendance
   */
  function uploadPhotoAndSign(
    name,
    regNumber,
    studentLat,
    studentLng,
    file,
    distance,
  ) {
    status.textContent = "Uploading photo... 📸";
    status.className = "status-message status-warning";

    const timestamp = Date.now();
    const fileName = `${regNumber}_${timestamp}_${file.name}`;
    const storageRef = storage.ref("students/" + fileName);

    storageRef
      .put(file)
      .then((snapshot) => {
        return snapshot.ref.getDownloadURL();
      })
      .then((photoURL) => {
        saveAttendance(
          name,
          regNumber,
          studentLat,
          studentLng,
          photoURL,
          distance,
        );
      })
      .catch((error) => {
        console.error("Error uploading photo:", error);
        status.textContent = "Photo upload failed. Signing without photo... ⚠️";
        // Save attendance without photo
        setTimeout(() => {
          saveAttendance(
            name,
            regNumber,
            studentLat,
            studentLng,
            null,
            distance,
          );
        }, 1000);
      });
  }

  /**
   * Save attendance record to Firebase Database
   */
  function saveAttendance(
    name,
    regNumber,
    studentLat,
    studentLng,
    photoURL,
    distance,
  ) {
    status.textContent = "Saving attendance... ⏳";

    const attendanceData = {
      name: name,
      regNumber: regNumber,
      studentLat: studentLat,
      studentLng: studentLng,
      distance: Math.round(distance),
      timestamp: Date.now(),
    };

    if (photoURL) {
      attendanceData.photoURL = photoURL;
    }

    database
      .ref("attendance/students")
      .push(attendanceData)
      .then(() => {
        status.innerHTML = `
          <strong>Attendance signed successfully! ✅</strong><br>
          <span style="font-size: 14px;">Welcome, ${name}!</span><br>
          <span style="font-size: 12px; color: #666;">Distance from teacher: ${Math.round(distance)}m</span>
        `;
        status.className = "status-message status-success";

        // Clear form
        studentNameInput.value = "";
        regNumberInput.value = "";
        photoInput.value = "";

        // Disable further submissions temporarily
        document.querySelector(".btn-primary").disabled = true;
        setTimeout(() => {
          document.querySelector(".btn-primary").disabled = false;
        }, 5000);
      })
      .catch((error) => {
        console.error("Error saving attendance:", error);
        status.textContent = "Error saving attendance. Please try again. ❌";
        status.className = "status-message status-error";
      });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns Distance in meters
   */
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check session status on page load
   */
  database
    .ref("attendance/session")
    .get()
    .then((snapshot) => {
      if (snapshot.exists() && snapshot.val().active) {
        status.textContent =
          "Attendance is OPEN! Fill in your details and sign. ✅";
        status.className = "status-message status-success";
      } else {
        status.textContent =
          "⚠️ No active attendance session. Please wait for your teacher to open attendance.";
        status.className = "status-message status-warning";
      }
    })
    .catch((error) => {
      console.error("Error checking session:", error);
      status.textContent =
        "Error connecting to server. Please refresh the page.";
      status.className = "status-message status-error";
    });

  // Listen for session changes in real-time
  database.ref("attendance/session/active").on("value", (snapshot) => {
    const isActive = snapshot.val();
    if (isActive === true) {
      status.textContent =
        "Attendance is OPEN! Fill in your details and sign. ✅";
      status.className = "status-message status-success";
    } else if (isActive === false) {
      status.textContent =
        "⚠️ Attendance session has been CLOSED by the teacher.";
      status.className = "status-message status-warning";
    }
  });

  console.log("Student portal loaded successfully ✅");
});
