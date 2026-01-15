// --- START OF FILE ShopSection.jsx ---

import { useEffect, useState } from "react";
// Xóa các import ảnh local
// import { S1, S2, S3, S4 } from "../IMG/Shop/";
import axios from "axios";
import { Link } from "react-router-dom";
import backupProducts from "../../data/backupProducts.json";

// Xóa imageMap
// const imageMap = { ... };

const API_BASE_URL = "https://coffeehousehub-production.up.railway.app";

function ShopSection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/products`)
      .then(res => {
        const products = res.data.slice(0, 4);
        setItems(products);
        // Lưu dữ liệu thành công vào localStorage
        try {
          localStorage.setItem('backup_products', JSON.stringify(res.data));
        } catch (e) {
          console.warn("Không thể lưu backup products:", e);
        }
      })
      .catch(err => {
        console.error("Lỗi API, sử dụng dữ liệu backup:", err);
        // Thử lấy từ localStorage trước, nếu không có thì dùng backup mặc định
        try {
          const savedBackup = localStorage.getItem('backup_products');
          if (savedBackup) {
            const products = JSON.parse(savedBackup).slice(0, 4);
            setItems(products);
          } else {
            setItems(backupProducts.slice(0, 4));
          }
        } catch (e) {
          setItems(backupProducts.slice(0, 4));
        }
      });
  }, []);

  return (
    <section className="bg-white text-[#3E2C24] pt-[50px] pb-[50px]">
      <div className="container mx-auto px-6 text-center">
        <p className="text-2xl uppercase text-[#b48a64] mb-2">Điều tuyệt vời diễn ra tại đây</p>
        <h2 className="text-3xl md:text-5xl font-bold mb-2">CÀ PHÊ - KHƠI NGUỒN CẢM HỨNG</h2>
        <div className="w-20 h-[2px] bg-[#D9A074] mx-auto mb-12"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {items.map((item, index) => (
            <Link 
              to={`/sanpham/${item.id}`} 
              key={item.id || index} 
              className="relative text-left block"
            >
              {(item.sale === true || item.sale === 1) && (
                <span className="absolute top-3 left-3 bg-[#D9A074] text-white text-xs font-semibold px-2 py-1 rounded">SALE</span>
              )}
              <img
                // Sử dụng trực tiếp item.image là URL từ Cloudinary
                src={item.image || "https://via.placeholder.com/300x300?text=No+Image"}
                alt={item.name}
                className="w-full h-auto mb-4"
              />
              <h3 className="font-bold text-md mb-1 uppercase">{item.name}</h3>
              <div className="flex items-center gap-2 text-sm">
                {item.original ? (
                  <>
                    <span className="line-through text-gray-400">
                      {Number(item.original).toLocaleString("vi-VN")}đ
                    </span>
                    <span className="text-[#3E2C24] font-semibold">
                      {Number(item.price).toLocaleString("vi-VN")}đ
                    </span>
                  </>
                ) : (
                  <span className="text-[#3E2C24] font-semibold">
                    {Number(item.price).toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <Link to="/sanpham" className="inline-block bg-[#D9A074] text-white font-semibold px-8 py-4 rounded-full shadow-md hover:bg-[#c98b50] transition">
            XEM THÊM SẢN PHẨM
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ShopSection;