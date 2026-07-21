# 🤖 Project: A Robot — Eloquent JavaScript (Chapter 7)

Dự án triển khai toàn bộ mã nguồn và giải các bài tập trong Chương 7 sách *Eloquent JavaScript*: thiết kế hệ thống điều khiển rô-bốt giao hàng tự động trong ngôi làng Meadowfield.

---

## 📌 Tính năng chính

* **Mô hình hóa bản đồ đồ thị (`roadGraph`)**: Chuyển đổi danh sách các con đường thành đồ thị dạng danh sách kề theo phong cách Lập trình chức năng (Functional Programming).


* **Quản lý trạng thái bất biến (`VillageState`)**: Mọi hành động di chuyển (`move`) đều trả về một đối tượng trạng thái mới mà không làm thay đổi dữ liệu cũ.


* **Thuật toán BFS (`findRoute`)**: Tìm con đường ngắn nhất giữa hai địa điểm bất kỳ bằng thuật toán Tìm kiếm theo chiều rộng (Breadth-First Search).


* **Các thuật toán điều khiển rô-bốt**:
* `randomRobot`: Di chuyển hoàn toàn ngẫu nhiên.


* `routeRobot`: Đi theo lộ trình cố định (`mailRoute`) bao phủ toàn bộ làng.


* `goalOrientedRobot`: Sử dụng BFS để nhắm vào gói hàng đầu tiên trong danh sách.


* `smarterRobot`: Tính toán khoảng cách tới tất cả gói hàng, chọn đường ngắn nhất và ưu tiên nhặt hàng.


* `bestRobot`: Kết hợp chiến lược nhặt hàng gần nhất và thuật toán **Nearest Neighbor TSP** để tối ưu chuỗi giao hàng.




* **Bài tập mở rộng**:
* **Exercise 1 (Measuring a Robot)**: Hàm `compareRobots` đo lường và so sánh hiệu suất rô-bốt trên 100 bài kiểm tra ngẫu nhiên đồng nhất.


* **Exercise 2 (Robot Efficiency)**: Cải tiến bộ não rô-bốt đạt hiệu suất tối cao (`smarterRobot`, `bestRobot`).


* **Exercise 3 (Persistent Group)**: Lớp `PGroup` triển khai cấu trúc dữ liệu tập hợp bất biến.





---

## 📊 Bảng so sánh hiệu suất Rô-bốt

| Bộ não Rô-bốt | Chiến lược di chuyển | Số bước trung bình (100 lần thử) |
| --- | --- | --- |
| **`randomRobot`** | Di chuyển ngẫu nhiên| ~63 bước|
| **`routeRobot`** | Lộ trình cố định `mailRoute`<br> | ~18 bước|
| **`goalOrientedRobot`** | BFS tới gói hàng đầu tiên (`parcels[0]`)| ~16 bước|
| **`smarterRobot`** | BFS chọn mục tiêu gần nhất + Ưu tiên nhặt hàng| ~12 - 13 bước|
| **`bestRobot`** | Ưu tiên nhặt hàng + Nearest Neighbor TSP khi giao hàng| **< 12 bước**<br> |

