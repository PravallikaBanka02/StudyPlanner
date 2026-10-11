const BASE_URL = '/api';

function getHeaders(isFormData = false) {
  const user = JSON.parse(localStorage.getItem('studyplanner_user') || 'null');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (user && user.id) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

export const api = {
  // Auth
  async loginEmail(email, password, name) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  async loginGoogle(profileData) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Google login failed');
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.subject && params.subject !== 'All') query.append('subject', params.subject);
    if (params.completed !== undefined) query.append('completed', params.completed);
    if (params.priority) query.append('priority', params.priority);

    const res = await fetch(`${BASE_URL}/tasks?${query.toString()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createTask(taskData) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add task');
    return res.json();
  },

  async toggleCompleteTask(id, completed) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async updateTask(id, updates) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  // Focus Sessions & Stats
  async logSession(sessionData) {
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData)
    });
    if (!res.ok) throw new Error('Failed to record session');
    return res.json();
  },

  async getSessions() {
    const res = await fetch(`${BASE_URL}/sessions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${BASE_URL}/stats`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Documents
  async getDocuments(subject = '') {
    const url = subject && subject !== 'All' 
      ? `${BASE_URL}/documents?subject=${encodeURIComponent(subject)}` 
      : `${BASE_URL}/documents`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return res.json();
  },

  async uploadDocument(formData) {
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  }
};
