import { create } from 'zustand';

// 安全说明：使用 sessionStorage 替代 localStorage
// sessionStorage 在浏览器关闭后自动清除，降低 XSS 攻击风险
const useUserStore = create((set, get) => ({
  user: null,
  apiKey: null,
  isLoggedIn: false,

  setUser: (user) => set({ user, isLoggedIn: !!user }),

  setApiKey: (apiKey) => {
    if (apiKey) {
      sessionStorage.setItem('apiKey', apiKey);
    } else {
      sessionStorage.removeItem('apiKey');
    }
    set({ apiKey });
  },

  login: (user, apiKey) => {
    if (apiKey) {
      sessionStorage.setItem('apiKey', apiKey);
    }
    set({ user, apiKey, isLoggedIn: true });
  },

  logout: () => {
    sessionStorage.removeItem('apiKey');
    sessionStorage.removeItem('user-storage');
    set({ user: null, apiKey: null, isLoggedIn: false });
  },

  getUser: () => get().user,

  getApiKey: () => {
    const storedKey = sessionStorage.getItem('apiKey');
    return storedKey || get().apiKey;
  },

  // 初始化时从 sessionStorage 恢复状态
  initialize: () => {
    const storedKey = sessionStorage.getItem('apiKey');
    if (storedKey) {
      set({ apiKey: storedKey });
    }
  }
}));

export default useUserStore;
