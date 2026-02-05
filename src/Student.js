/**
 * Student Attendance Script
 * Handles student attendance sign-in with geolocation verification and photo upload
 */

// DOM Elements
const status = document.getElementById("status");
const photoInput = document.getElementById("photo");
const studentNameInput = document.getElementById("studentName");

/**
 * Sign attendance with location verification and optional photo
 */
function signAttendance() {
  const name = studentNameInput.value.trim();
  const file = photoInput.files[0];

  // Validate name
  if (!name) {
    status.textContent = "Enter your name! ❌";
    return;
  }

  // Check for geolocation support
  if (!navigator.geolocation) {
    status.textContent = "Geolocation not supported! ❌";
    return;
  }

  status.textContent = "Getting your location... 📍";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const studentLat = position.coords.latitude;
      const studentLng = position.coords.longitude;

      // Check if there's an active attendance session
      database
        .ref("attendance/session")
        .get()
        .then((snapshot) => {
          if (!snapshot.exists()) {
            status.textContent =
              "No active session! Ask your teacher to open attendance. ❌";
            return;
          }

          const session = snapshot.val();
          if (!session.active) {
            status.textContent = "Attendance is closed! ❌";
            return;
          }

          const teacherLat = session.teacherLat;
          const teacherLng = session.teacherLng;
          const distance = getDistance(
            studentLat,
            studentLng,
            teacherLat,
            teacherLng,
          );

          // Check if student is within 30 meters of teacher
          if (distance > 30) {
            status.textContent = `Too far from teacher! Distance: ${Math.round(distance)}m (max 30m allowed) ❌`;
            return;
          }

          // Student is within range, proceed with attendance
          if (file && storage) {
            // Upload photo first, then save attendance
            uploadPhotoAndSignAttendance(name, studentLat, studentLng, file);
          } else {
            // Sign attendance without photo
            saveAttendance(name, studentLat, studentLng, null);
          }
        })
        .catch((error) => {
          console.error("Error checking session:", error);
          status.textContent =
            "Error checking attendance session. Please try again. ❌";
        });
    },
    (error) => {
      console.error("Geolocation error:", error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          status.textContent =
            "Please allow location access to sign attendance! ❌";
          break;
        case error.POSITION_UNAVAILABLE:
          status.textContent = "Location information unavailable. ❌";
          break;
        case error.TIMEOUT:
          status.textContent =
            "Location request timed out. Please try again. ❌";
          break;
        default:
          status.textContent = "An error occurred getting your location. ❌";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

/**
 * Upload photo to Firebase Storage and then save attendance
 */
function uploadPhotoAndSignAttendance(name, studentLat, studentLng, file) {
  status.textContent = "Uploading photo... 📸";

  const storageRef = storage.ref();
  const photoRef = storageRef.child("students/" + Date.now() + "_" + file.name);

  photoRef
    .put(file)
    .then(() => {
      return photoRef.getDownloadURL();
    })
    .then((photoURL) => {
      saveAttendance(name, studentLat, studentLng, photoURL);
    })
    .catch((error) => {
      console.error("Error uploading photo:", error);
      status.textContent = "Error uploading photo. Signing without photo... ⚠️";
      // Fallback: sign attendance without photo
      saveAttendance(name, studentLat, studentLng, null);
    });
}

/**
 * Save attendance record to Firebase Database
 */
function saveAttendance(name, studentLat, studentLng, photoURL) {
  const attendanceData = {
    name: name,
    studentLat: studentLat,
    studentLng: studentLng,
    timestamp: Date.now(),
  };

  // Add photo URL if available
  if (photoURL) {
    attendanceData.photoURL = photoURL;
  }

  database
    .ref("attendance/students")
    .push(attendanceData)
    .then(() => {
      status.textContent = `Attendance signed successfully! Welcome, ${name}. ✅`;
      // Clear the form
      studentNameInput.value = "";
      photoInput.value = "";
    })
    .catch((error) => {
      console.error("Error saving attendance:", error);
      status.textContent = "Error saving attendance. Please try again. ❌";
    });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
