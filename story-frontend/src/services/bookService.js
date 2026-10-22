import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

axios.interceptors.request.use(
  (config) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.token) {
      config.headers.Authorization = `Bearer ${userData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data &&
      error.response.data.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const userData = JSON.parse(localStorage.getItem("user"));
      const refreshToken = userData?.refreshToken;

      if (!refreshToken) {
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        const updatedUserData = {
          ...userData,
          token: newAccessToken,
          refreshToken: newRefreshToken,
        };
        localStorage.setItem("user", JSON.stringify(updatedUserData));

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const API         = `${BACKEND_URL}/api/books`;
const UPLOAD_API  = `${BACKEND_URL}/api/upload`;
const CHAPTER_API = `${BACKEND_URL}/api/chapters`;
const COMMENT_API = `${BACKEND_URL}/api/comments`;

// ── Books ──
export const getAllBooks    = (search = "") => axios.get(`${API}/all`, { params: { search } });
export const createBook    = (data)       => axios.post(`${API}/create`, data);
export const getMyBooks    = (author_id)  => axios.get(`${API}/my-books/${author_id}`);
export const getBookById   = (id)         => axios.get(`${API}/${id}`);
export const updateBook    = (id, data)   => axios.put(`${API}/${id}`, data);
export const deleteBook    = (id)         => axios.delete(`${API}/${id}`);
export const incrementBookReadCount = (id, chapterId, userId) => axios.post(`${API}/${id}/read`, { chapter_id: chapterId, user_id: userId }).catch(() => {});

// ── Upload ──
export const uploadCover = (file) => {
  const formData = new FormData();
  formData.append("cover", file);
  return axios.post(`${UPLOAD_API}/cover`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Chapters ──
export const getLatestChapters = ()           => axios.get(`${CHAPTER_API}/latest`);
export const createChapter     = (data)       => axios.post(`${CHAPTER_API}/create`, data);
export const getChaptersByBook = (book_id)    => axios.get(`${CHAPTER_API}/book/${book_id}`);
export const getChapterById    = (id)         => axios.get(`${CHAPTER_API}/${id}`);
export const updateChapter     = (id, data)   => axios.put(`${CHAPTER_API}/${id}`, data);
export const deleteChapter     = (id)         => axios.delete(`${CHAPTER_API}/${id}`);

// ── Comments ──
export const getCommentsByChapter = (chapter_id) => axios.get(`${COMMENT_API}/chapter/${chapter_id}`);
export const createComment        = (data)        => axios.post(`${COMMENT_API}`, data);
export const deleteComment        = (id)          => axios.delete(`${COMMENT_API}/${id}`);

// ── Users / Authors ──
export const getActiveAuthors     = ()            => axios.get(`${BACKEND_URL}/api/users`, { params: { has_book: "true" } });