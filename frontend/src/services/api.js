/**
 * API service layer — handles all communication with the Django REST backend.
 * Manages JWT token storage, auto-refresh, and request/response handling.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(access, refresh) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try refreshing the token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || 'Request failed');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) return null;

    return response.json();
  }

  async tryRefreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.access, data.refresh || this.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────

  async register(data) {
    const result = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(result.tokens.access, result.tokens.refresh);
    return result;
  }

  async login(username, password) {
    const result = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(result.access, result.refresh);
    return result;
  }

  logout() {
    this.clearTokens();
  }

  async getProfile() {
    return this.request('/auth/me/');
  }

  async updateProfile(data) {
    return this.request('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Exercises ─────────────────────────────────────────────────────────

  async getExercises(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/exercises/${query ? '?' + query : ''}`);
  }

  async getExercise(id) {
    return this.request(`/exercises/${id}/`);
  }

  // ─── Templates ─────────────────────────────────────────────────────────

  async getTemplates() {
    return this.request('/workouts/templates/');
  }

  async getTemplate(id) {
    return this.request(`/workouts/templates/${id}/`);
  }

  async createTemplate(data) {
    return this.request('/workouts/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id, data) {
    return this.request(`/workouts/templates/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id) {
    return this.request(`/workouts/templates/${id}/`, {
      method: 'DELETE',
    });
  }

  // ─── Sessions ──────────────────────────────────────────────────────────

  async getSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/workouts/sessions/${query ? '?' + query : ''}`);
  }

  async getSession(id) {
    return this.request(`/workouts/sessions/${id}/`);
  }

  async startSession(data) {
    return this.request('/workouts/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async finishSession(id, data = {}) {
    return this.request(`/workouts/sessions/${id}/finish/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Set Logs ──────────────────────────────────────────────────────────

  async addSet(sessionId, data) {
    return this.request(`/workouts/sessions/${sessionId}/sets/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeSet(sessionId, setId) {
    return this.request(`/workouts/sessions/${sessionId}/sets/${setId}/`, {
      method: 'DELETE',
    });
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────

  async getDashboardStats() {
    return this.request('/workouts/dashboard/');
  }

  // ─── Gamification ──────────────────────────────────────────────────────

  async getTodayQuests() {
    return this.request('/gamification/quests/today/');
  }

  async completeQuest(id) {
    return this.request(`/gamification/quests/${id}/complete/`, {
      method: 'POST',
    });
  }

  async getAchievements() {
    return this.request('/gamification/achievements/');
  }

  // ─── AI Features ───────────────────────────────────────────────────────────

  /**
   * Parse a natural-language workout description into structured set data.
   * @param {string} text  e.g. "3 sets bench press 80kg 10 reps"
   * @returns {{ exercises: Array<{ exercise_name: string, sets: Array<{ reps, weight_kg, duration_seconds }> }> }}
   */
  async parseWorkout(text) {
    return this.request('/ai/parse-workout/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Generate AI-written Solo Leveling-style quest copy tailored to the user's stats.
   * @returns {{ quests: Array<{ title, description, flavor, xp_reward }> }}
   */
  async generateQuests() {
    return this.request('/ai/quest-generate/', {
      method: 'POST',
    });
  }

  /**
   * Send a message to the AI Coach and get a reply.
   * The caller maintains message history in state and passes the full array each time.
   * @param {Array<{ role: 'user'|'assistant', content: string }>} messages
   * @returns {{ reply: string, tools_used: string[] }}
   */
  async chatCoach(messages) {
    return this.request('/ai/coach/', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  // ─── Nutrition (Mana & Fuel) ───────────────────────────────────────────────

  async getTodayNutrition() {
    return this.request('/nutrition/today/');
  }

  async updateTodayNutrition(data) {
    return this.request('/nutrition/today/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async quickLogNutrition(deltas) {
    return this.request('/nutrition/quick-add/', {
      method: 'POST',
      body: JSON.stringify(deltas),
    });
  }

  async getNutritionHistory(days = 7) {
    return this.request(`/nutrition/history/?days=${days}`);
  }

  // ─── Social & Guild ────────────────────────────────────────────────────────

  async getLeaderboard(scope = 'global', timeframe = 'weekly') {
    return this.request(`/social/leaderboard/?scope=${scope}&timeframe=${timeframe}`);
  }

  async getFriends() {
    return this.request('/social/friends/');
  }

  async sendFriendRequest(username) {
    return this.request('/social/friends/request/', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async respondFriendRequest(friendshipId, action) {
    return this.request('/social/friends/respond/', {
      method: 'POST',
      body: JSON.stringify({ friendship_id: friendshipId, action }),
    });
  }

  async removeFriend(userId) {
    return this.request(`/social/friends/${userId}/`, {
      method: 'DELETE',
    });
  }

  async searchUsers(query) {
    return this.request(`/social/users/search/?q=${encodeURIComponent(query)}`);
  }
}

const api = new ApiService();
export default api;
