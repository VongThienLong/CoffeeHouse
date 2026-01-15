import React, { useEffect, useState } from 'react';
import axios from 'axios';
import backupCafes from '../../data/backupCafes.json';

const API_BASE_URL = 'https://coffeehousehub-production.up.railway.app';

function CafeList() {
  const [cafes, setCafes] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/cafe`)
      .then(res => {
        console.log("Dữ liệu từ API:", res.data);
        setCafes(res.data);
        // Lưu dữ liệu thành công vào localStorage
        try {
          localStorage.setItem('backup_cafes', JSON.stringify(res.data));
        } catch (e) {
          console.warn("Không thể lưu backup cafes:", e);
        }
      })
      .catch(err => {
        console.error("Lỗi gọi API, sử dụng dữ liệu backup:", err);
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
      });
  }, []);

  return (
    <div>
      <h2>Danh sách cafe</h2>
      {cafes.length === 0 ? (
        <p>Không có sản phẩm nào.</p>
      ) : (
        <ul>
          {cafes.map((cafe) => (
            <li key={cafe.id}>
              <div>{cafe.name}</div> {/* Giả sử bạn có trường 'name' */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CafeList;
