import axios from 'axios';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api');

const getUserEmail = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser).email;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const liveSessionService = {
  // Live Sessions
  getSessions: async () => {
    const email = getUserEmail();
    console.log("Fetching sessions from:", `${API_BASE}/live-sessions/`, "with email:", email);
    const response = await axios.get(`${API_BASE}/live-sessions/`, {
      params: { email }
    });
    return response.data;
  },

  createSession: async (sessionData) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/live-sessions/`, {
      ...sessionData,
      email
    });
    return response.data;
  },

  updateSession: async (sessionId, sessionData) => {
    const email = getUserEmail();
    const response = await axios.put(`${API_BASE}/live-sessions/${sessionId}/`, {
      ...sessionData,
      email
    });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.delete(`${API_BASE}/live-sessions/${sessionId}/`, {
      data: { email }
    });
    return response.data;
  },

  getSessionDetails: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.get(`${API_BASE}/live-sessions/${sessionId}/`, {
      params: { email }
    });
    return response.data;
  },

  startSession: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/live-sessions/${sessionId}/start/`, {
      email
    });
    return response.data;
  },

  endSession: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/live-sessions/${sessionId}/end/`, {
      email
    });
    return response.data;
  },

  uploadMaterial: async (sessionId, materialData) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/live-sessions/${sessionId}/materials/`, {
      ...materialData,
      email
    });
    return response.data;
  },

  // Attendance
  joinSession: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/attendance/join/`, {
      session_id: sessionId,
      email
    });
    return response.data;
  },

  leaveSession: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/attendance/leave/`, {
      session_id: sessionId,
      email
    });
    return response.data;
  },

  getAttendanceAnalytics: async (sessionId = null) => {
    const email = getUserEmail();
    const params = { email };
    if (sessionId) params.session_id = sessionId;
    const response = await axios.get(`${API_BASE}/attendance/analytics/`, {
      params
    });
    return response.data;
  },

  // Recordings
  getRecordings: async () => {
    const email = getUserEmail();
    const response = await axios.get(`${API_BASE}/recordings/`, {
      params: { email }
    });
    return response.data;
  },

  addRecording: async (recordingData) => {
    const email = getUserEmail();
    const response = await axios.post(`${API_BASE}/recordings/`, {
      ...recordingData,
      email
    });
    return response.data;
  },

  // Room status (for waiting-room polling)
  getRoomStatus: async (sessionId) => {
    const email = getUserEmail();
    const response = await axios.get(`${API_BASE}/live-sessions/${sessionId}/room-status/`, {
      params: { email }
    });
    return response.data;
  },
};

