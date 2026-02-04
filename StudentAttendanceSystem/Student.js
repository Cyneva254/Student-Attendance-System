// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBcQjfn8PtDBcSZdAkwTN54DPugcUJDHXU",
  authDomain: "student-attendance-syste-23fcd.firebaseapp.com",
  projectId: "student-attendance-syste-23fcd",
  storageBucket: "student-attendance-syste-23fcd.firebasestorage.app",
  messagingSenderId: "1018526780498",
  appId: "1:1018526780498:web:8487674392b0826a6be38b"
};
firebase.initializeApp(firebaseConfig);

function signAttendance() {
  const name = document.getElementById('studentName').value;
  if (!name) { status.textContent = "Enter your name!"; return; }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const studentLat = position.coords.latitude;
      const studentLng = position.coords.longitude;

      database.ref('attendance/session').get().then(snapshot => {
        if (!snapshot.exists()) { status.textContent = "No active session! ❌"; return; }
        const session = snapshot.val();
        if (!session.active) { status.textContent = "Attendance closed ❌"; return; }

        const teacherLat = session.teacherLat;
        const teacherLng = session.teacherLng;
        const distance = getDistance(studentLat, studentLng, teacherLat, teacherLng);

        if (distance <= 30) {
          status.textContent = `Attendance signed! ✅`;
          database.ref('attendance/students').push({
            name,
            studentLat,
            studentLng,
            timestamp: Date.now()
          });
        } else {
          status.textContent = `Too far from teacher! Distance: ${Math.round(distance)}m ❌`;
        }
      });

    }, () => { status.textContent = "Allow location access! ❌"; });
  } else {
    status.textContent = "Geolocation not supported!";
  }
}
const file = document.getElementById('photo').files[0];

if (!file) {
  status.textContent = "Please upload a profile picture.";
  return;
}

const storageRef = firebase.storage().ref();
const photoRef = storageRef.child('students/' + Date.now() + '_' + file.name);

photoRef.put(file).then(() => {
  photoRef.getDownloadURL().then((photoURL) => {

    database.ref('attendance/students').push({
      name,
      photoURL,
      timestamp: Date.now()
    });

    status.textContent = `Attendance signed! Welcome, ${name}. ✅`;
  });
});


// Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // meters
}

function deg2rad(deg) { return deg * (Math.PI/180); }

