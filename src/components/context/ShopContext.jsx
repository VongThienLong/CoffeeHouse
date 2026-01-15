import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// Đặt URL backend Railway ở đây (dùng HTTPS, KHÔNG có port để tránh lỗi SSL)
const API_BASE_URL = 'https://coffeehousehub-production.up.railway.app';
import { message } from 'antd'; // Sử dụng message của antd để thông báo đẹp hơn

// Import backup data
import backupProducts from '../../data/backupProducts.json';
import backupCafes from '../../data/backupCafes.json';

// DEV ONLY: Bật login giả để test cart mà không cần backend auth
const FORCE_LOGIN = true;
const DEV_USER = {
  id: 0,
  fullname: "Test User",
  email: "test@coffeehouse.local",
  role: "user",
};

const readDevCart = () => {
  try {
    const saved = localStorage.getItem('dev_cart');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn("Không thể đọc dev_cart:", e);
    return [];
  }
};

const writeDevCart = (items) => {
  try {
    localStorage.setItem('dev_cart', JSON.stringify(items));
  } catch (e) {
    console.warn("Không thể lưu dev_cart:", e);
  }
};

export const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  // =================================================================
  // 1. STATES - QUẢN LÝ TOÀN BỘ DỮ LIỆU CỦA ỨNG DỤNG
  // =================================================================
  
  // Dữ liệu người dùng
  const [user, setUser] = useState(null);
  
  // Dữ liệu giỏ hàng và thông báo
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dữ liệu sản phẩm và menu
  const [products, setProducts] = useState([]);
  const [cafes, setCafes] = useState([]);
  
  // Trạng thái loading
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // =================================================================
  // 2. AUTHENTICATION & USER FUNCTIONS - CÁC HÀM LIÊN QUAN ĐẾN NGƯỜI DÙNG
  // =================================================================

  // Hàm cập nhật state người dùng
  const updateUser = (newUser) => {
    setUser(newUser);
    if (!newUser) {
      // Khi đăng xuất, xóa token và reset các state liên quan
      localStorage.removeItem('token');
      setCart([]);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Hàm kiểm tra token và lấy thông tin user khi tải lại trang
  const checkUserStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    setIsAuthLoading(true);
    if (FORCE_LOGIN) {
      localStorage.setItem('token', 'dev-token');
      updateUser(DEV_USER);
      setIsAuthLoading(false);
      return;
    }
    if (token) {
      try {
        const res = await axios.get(`${API_BASE_URL}/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        updateUser(res.data);
      } catch (error) {
        console.error("Token không hợp lệ hoặc đã hết hạn.", error);
        updateUser(null); // Xóa user nếu token hỏng
      }
    } else {
      updateUser(null); // Không có token
    }
    setIsAuthLoading(false);
  }, []);

  // Gọi hàm kiểm tra user MỘT LẦN DUY NHẤT khi app khởi động
  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);


  // =================================================================
  // 3. DATA FETCHING FUNCTIONS - CÁC HÀM LẤY DỮ LIỆU TỪ SERVER
  // =================================================================

  const fetchProducts = useCallback(() => {
    axios.get(`${API_BASE_URL}/products`)
      .then((res) => {
        setProducts(res.data);
        // Lưu dữ liệu thành công vào localStorage để dùng làm backup
        try {
          localStorage.setItem('backup_products', JSON.stringify(res.data));
        } catch (e) {
          console.warn("Không thể lưu backup products vào localStorage:", e);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải sản phẩm từ API, sử dụng dữ liệu backup:", err);
        // Thử lấy từ localStorage trước, nếu không có thì dùng backup mặc định
        try {
          const savedBackup = localStorage.getItem('backup_products');
          if (savedBackup) {
            setProducts(JSON.parse(savedBackup));
            console.log("Đã sử dụng dữ liệu backup từ localStorage");
          } else {
            setProducts(backupProducts);
            console.log("Đã sử dụng dữ liệu backup mặc định");
          }
        } catch (e) {
          setProducts(backupProducts);
          console.log("Đã sử dụng dữ liệu backup mặc định (lỗi localStorage)");
        }
        message.warning("Không thể kết nối đến server. Đang hiển thị dữ liệu backup.");
      });
  }, []);

  const fetchCafes = useCallback(() => {
    axios.get(`${API_BASE_URL}/cafe`)
      .then((res) => {
        setCafes(res.data);
        // Lưu dữ liệu thành công vào localStorage để dùng làm backup
        try {
          localStorage.setItem('backup_cafes', JSON.stringify(res.data));
        } catch (e) {
          console.warn("Không thể lưu backup cafes vào localStorage:", e);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải menu cafe từ API, sử dụng dữ liệu backup:", err);
        // Thử lấy từ localStorage trước, nếu không có thì dùng backup mặc định
        try {
          const savedBackup = localStorage.getItem('backup_cafes');
          if (savedBackup) {
            setCafes(JSON.parse(savedBackup));
            console.log("Đã sử dụng dữ liệu backup từ localStorage");
          } else {
            setCafes(backupCafes);
            console.log("Đã sử dụng dữ liệu backup mặc định");
          }
        } catch (e) {
          setCafes(backupCafes);
          console.log("Đã sử dụng dữ liệu backup mặc định (lỗi localStorage)");
        }
        message.warning("Không thể kết nối đến server. Đang hiển thị dữ liệu backup.");
      });
  }, []);
  
  const fetchCart = useCallback(async () => {
    if (FORCE_LOGIN) {
      const devCart = readDevCart();
      setCart(devCart);
      return devCart;
    }
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
        const res = await axios.get(`${API_BASE_URL}/cart/select`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCart(res.data);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi tải giỏ hàng:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            updateUser(null); // Token hết hạn, tự động đăng xuất
        }
        setCart([]);
        return [];
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
        const res = await axios.get(`${API_BASE_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.is_read).length);
        return res.data;
    } catch (err) {
        console.error("Lỗi khi tải thông báo:", err);
        setNotifications([]);
        setUnreadCount(0);
        return [];
    }
  }, []);

  // useEffect để tải dữ liệu chung (Sản phẩm, Menu) khi app khởi động
  useEffect(() => {
    fetchProducts();
    fetchCafes();
  }, [fetchProducts, fetchCafes]);

  // useEffect để tải dữ liệu riêng (Giỏ hàng, Thông báo) chỉ khi user đã đăng nhập
  useEffect(() => {
    if (user && !isAuthLoading) {
      fetchCart();
      fetchNotifications();
    }
  }, [user, isAuthLoading, fetchCart, fetchNotifications]);


  // =================================================================
  // 4. ACTION FUNCTIONS - CÁC HÀM TƯƠNG TÁC
  // =================================================================
  
  const addToCart = (productId, type, quantity = 1, image = null) => {
    if (FORCE_LOGIN) {
      const devCart = readDevCart();
      const sourceItem = type === "cafe"
        ? cafes.find((item) => item.id === productId)
        : products.find((item) => item.id === productId);
      const cartid = `dev-${type}-${productId}`;
      const existing = devCart.find((item) => item.cartid === cartid);
      if (existing) {
        existing.quantity += quantity;
      } else {
        devCart.push({
          cartid,
          productId,
          type,
          name: sourceItem?.name || "Sản phẩm",
          price: Number(sourceItem?.price || 0),
          quantity,
          image: image || sourceItem?.image || sourceItem?.img || null,
        });
      }
      writeDevCart(devCart);
      setCart([...devCart]);
      message.success("Đã thêm vào giỏ hàng!");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    
    axios.post(`${API_BASE_URL}/cart/add`, { productId, type, quantity, image }, { 
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      message.success("Đã thêm vào giỏ hàng!");
      fetchCart(); // Tải lại giỏ hàng sau khi thêm
    })
    .catch(err => message.error(err.response?.data?.error || "Không thể thêm vào giỏ hàng"));
  };

  const updateCartQuantity = (cartId, quantity) => {
    if (FORCE_LOGIN) {
      if (quantity <= 0) {
        removeFromCart(cartId);
        return;
      }
      const devCart = readDevCart();
      const updated = devCart.map((item) =>
        item.cartid === cartId ? { ...item, quantity } : item
      );
      writeDevCart(updated);
      setCart(updated);
      return;
    }
    const token = localStorage.getItem('token');
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    axios.put(`${API_BASE_URL}/cart/${cartId}`, { quantity }, { 
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => fetchCart())
      .catch((err) => message.error("Lỗi khi cập nhật giỏ hàng: " + err.message));
  };

  const removeFromCart = (cartId) => {
    if (FORCE_LOGIN) {
      const devCart = readDevCart();
      const updated = devCart.filter((item) => item.cartid !== cartId);
      writeDevCart(updated);
      setCart(updated);
      message.info("Đã xóa sản phẩm khỏi giỏ hàng.");
      return;
    }
    const token = localStorage.getItem('token');
    axios.delete(`${API_BASE_URL}/cart/${cartId}`, { 
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        message.info("Đã xóa sản phẩm khỏi giỏ hàng.");
        fetchCart();
      })
      .catch((err) => message.error("Lỗi khi xóa sản phẩm: " + err.message));
  };

  const markNotificationsAsRead = () => {
    // Cập nhật UI ngay lập tức
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);

    // Gọi API nền
    const token = localStorage.getItem('token');
    axios.post(`${API_BASE_URL}/notifications/mark-read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
        message.error("Không thể đồng bộ trạng thái thông báo.");
        fetchNotifications(); // Rollback nếu lỗi
    });
  };

  const markOneNotificationAsRead = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.is_read) return;

    // Cập nhật UI ngay lập tức
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Gọi API nền
    const token = localStorage.getItem('token');
    axios.post(`${API_BASE_URL}/notifications/${notificationId}/mark-one-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
        console.error("Lỗi khi đánh dấu 1 thông báo đã đọc:", err);
        message.error("Không thể cập nhật trạng thái thông báo.");
        fetchNotifications(); // Rollback nếu lỗi
    });
  };

  // =================================================================
  // 5. CONTEXT VALUE - CUNG CẤP STATE VÀ HÀM CHO TOÀN BỘ ỨNG DỤNG
  // =================================================================
  const contextValue = {
    // States
    user,
    cart,
    products, // Đã có lại
    cafes,    // Đã có lại
    notifications,
    unreadCount,
    isAuthLoading,

    // Hàm cập nhật
    updateUser,

    // Hàm fetch dữ liệu
    fetchCart,
    fetchProducts,
    fetchCafes,
    fetchNotifications,

    // Hàm tương tác
    addToCart,
    updateCartQuantity,
    removeFromCart,
    markNotificationsAsRead,
    markOneNotificationAsRead,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export const ShopContextProvider = ShopProvider;