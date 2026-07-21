# BÁO CÁO PHÂN TÍCH VÀ GIẢI THÍCH KIẾN TRÚC MÃ NGUỒN: PROJECT A ROBOT

---

## I. NGUYÊN LÝ THIẾT KẾ & BẢN ĐỒ LÀNG MEADOWFIELD

### 1. Mô hình hóa bản đồ bằng Đồ thị (Adjacency List)

Toàn bộ thế giới ảo Meadowfield được biểu diễn dưới dạng một đồ thị vô hướng (undirected graph). Dữ liệu thô ban đầu là một mảng chuỗi `roads` chứa các đoạn đường nối giữa hai địa điểm phân tách bởi dấu gạch ngang `"-"`:

```javascript
const roads = [
  "Alice's House-Bob's House",   "Alice's House-Cabin",
  "Alice's House-Post Office",   "Bob's House-Town Hall",
  "Daria's House-Ernie's House", "Daria's House-Town Hall",
  "Ernie's House-Grete's House", "Grete's House-Farm",
  "Grete's House-Shop",          "Marketplace-Farm",
  "Marketplace-Post Office",     "Marketplace-Shop",
  "Marketplace-Town Hall",       "Shop-Town Hall"
];

```

Để chuyển đổi danh sách các cạnh này thành cấu trúc dữ liệu dễ truy vấn, hàm `buildGraph(edges)` được triển khai theo triết lý **Lập trình chức năng (Functional Programming)**:

```javascript
function buildGraph(edges) {
  let graph = Object.create(null);
  
  function addEdge(from, to) {
    if (from in graph) {
      graph[from].push(to);
    } else {
      graph[from] = [to];
    }
  }
  
  for (let [from, to] of edges.map(r => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

const roadGraph = buildGraph(roads);

```

* **`Object.create(null)`**: Tạo ra một đối tượng rỗng thuần túy không kế thừa các thuộc tính từ `Object.prototype`, tránh nguy cơ đụng độ tên thuộc tính hệ thống.


* **Đồ thị hai chiều**: Với mỗi cặp kết nối `from - to`, hàm `addEdge` được gọi hai lần (`addEdge(from, to)` và `addEdge(to, from)`) để đảm bảo rô-bốt có thể di chuyển khứ hồi giữa hai điểm.


* **Tính nguyên vẹn dữ liệu**: Hàm sử dụng `.map(r => r.split("-"))` để xử lý mảng đầu vào mà không làm thay đổi (mutate) mảng `roads` ban đầu.



---

### 2. Quản lý trạng thái bằng Nguyên lý Bất biến (Immutability)

Lớp `VillageState` đóng vai trò là "ảnh chụp" (snapshot) toàn bộ trạng thái của ngôi làng tại một thời điểm nhất định:

```javascript
class VillageState {
  constructor(place, parcels) {
    this.place = place;     // Vị trí hiện tại của rô-bốt
    this.parcels = parcels; // Mảng các đối tượng gói hàng: [{place, address}]
  }

  move(destination) {
    if (!roadGraph[this.place].includes(destination)) {
      return this;
    } else {
      let parcels = this.parcels.map(p => {
        if (p.place != this.place) return p;
        return {place: destination, address: p.address};
      }).filter(p => p.place != p.address);

      return new VillageState(destination, parcels);
    }
  }
}

```

* **Cơ chế hoạt động của `move(destination)**`:
1. **Kiểm tra hợp lệ**: Xác minh điểm đến `destination` có nằm trong danh sách kề `roadGraph[this.place]` hay không. Nếu không có đường nối, hàm trả về nguyên đối tượng trạng thái cũ `this` mà không thực hiện thay đổi.


2. **Cập nhật vị trí gói hàng**: Duyệt qua mảng `parcels`. Những gói hàng nào đang ở cùng vị trí với rô-bốt (`p.place == this.place`) sẽ được di chuyển tới `destination`. Những gói hàng rô-bốt chưa nhặt giữ nguyên vị trí cũ.


3. **Lọc hàng đã giao**: Phương thức `.filter(p => p.place != p.address)` loại bỏ ngay lập tức những gói hàng có vị trí hiện tại trùng với địa chỉ nhận (`address`).


4. **Tạo trạng thái mới**: Trả về một thể hiện `new VillageState(destination, parcels)` hoàn toàn mới. Việc không sửa đổi dữ liệu trực tiếp giúp dễ dàng truy vết lịch sử di chuyển và tránh các lỗi side-effect ngoài ý muốn.





---

### 3. Hàm tạo trạng thái ngẫu nhiên

Để phục vụ việc kiểm thử, `VillageState.random` khởi tạo môi trường thử nghiệm ngẫu nhiên:

```javascript
VillageState.random = function(parcelCount = 5) {
  let parcels = [];
  for (let i = 0; i < parcelCount; i++) {
    let address = randomPick(Object.keys(roadGraph));
    let place;
    do {
      place = randomPick(Object.keys(roadGraph));
    } while (place == address);
    parcels.push({place, address});
  }
  return new VillageState("Post Office", parcels);
};

```

Vòng lặp `do...while` đảm bảo gói hàng không bao giờ được khởi tạo tại điểm trùng với địa chỉ đích của nó (`place != address`). Rô-bốt luôn xuất phát tại `"Post Office"`.

---

## II. THUẬT TOÁN TÌM ĐƯỜNG NGẮN NHẤT (BREADTH-FIRST SEARCH - BFS)

Hàm `findRoute` là trái tim thuật toán giúp các thế hệ rô-bốt thông minh xác định con đường tối ưu giữa hai điểm bất kỳ trên đồ thị.

```javascript
function findRoute(graph, from, to) {
  let work = [{at: from, route: []}];
  
  for (let i = 0; i < work.length; i++) {
    let {at, route} = work[i];
    
    for (let place of graph[at]) {
      if (place == to) return route.concat(place);
      
      if (!work.some(w => w.at == place)) {
        work.push({at: place, route: route.concat(place)});
      }
    }
  }
}

```

### Cơ chế hoạt động chi tiết của BFS:

1. **Hàng đợi `work**`: Lưu danh sách các nút cần khám phá. Mỗi phần tử gồm hai thông tin: `at` (điểm đang đứng) và `route` (mảng lưu chuỗi các điểm đã đi qua từ điểm xuất phát).


2. **Duyệt theo chiều rộng (Loang theo từng lớp)**: Thuật toán kiểm tra tất cả các nút cách `from` 1 bước, sau đó đến các nút cách 2 bước, 3 bước... Đảm bảo rằng con đường đầu tiên chạm tới đích `to` luôn là con đường ngắn nhất về số bước di chuyển.


3. **Tránh lặp vô hạn (Cycle Prevention)**: Điều kiện `!work.some(w => w.at == place)` kiểm tra xem địa điểm `place` đã từng được thêm vào mảng `work` trước đó chưa. Nếu đã có trong `work`, thuật toán bỏ qua để tránh rô-bốt đi vòng tròn vô tận giữa các điểm kề nhau.


4. **Kết quả trả về**: Ngay khi `place == to`, hàm lập tức dừng và trả về mảng con đường đầy đủ `route.concat(place)`.



---

## III. TIẾN HÓA CÁC "BỘ NÃO" RÔ-BỐT

Sự tiến hóa của các giải thuật điều khiển rô-bốt thể hiện việc tối ưu hóa từ di chuyển ngẫu nhiên đến các giải thuật tham ăn (Greedy) và quy hoạch lộ trình nâng cao (TSP).

```
                 +-------------------+
                 |    randomRobot    | (~63 bước)
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |    routeRobot     | (~18 bước)
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 | goalOrientedRobot | (~16 bước)
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |   smarterRobot    | (~12-13 bước)
                 +---------+---------+
                           |
                           v
                 +-------------------+
                 |     bestRobot     | (Tối ưu chuỗi giao)
                 +-------------------+

```

---

### 1. `randomRobot` (Di chuyển ngẫu nhiên)

* **Chiến lược**: Lựa chọn ngẫu nhiên một trong các điểm kề với vị trí hiện tại thông qua `randomPick(roadGraph[state.place])`.


* **Bộ nhớ (`memory`)**: Không sử dụng.


* **Đánh giá**: Hiệu suất cực kỳ thấp (trung bình ~63 lượt đi) do bị quẩn quanh tại các vòng lặp.



---

### 2. `routeRobot` (Cố định tuyến đường)

* **Chiến lược**: Sử dụng một lộ trình cố định `mailRoute` gồm 13 điểm đi qua toàn bộ các địa danh trong làng Meadowfield:


```javascript
const mailRoute = [
  "Alice's House", "Cabin", "Alice's House", "Bob's House",
  "Town Hall", "Daria's House", "Ernie's House",
  "Grete's House", "Shop", "Grete's House", "Farm",
  "Marketplace", "Post Office"
];

```


* **Bộ nhớ (`memory`)**: Lưu trữ các điểm còn lại trong lộ trình cố định chưa đi qua.


* **Đánh giá**: Đạt trung bình ~18 lượt đi. Tuy tối ưu hơn ngẫu nhiên nhưng vẫn lãng phí bước đi vì phải chạy hết lộ trình cố định dù hàng đã được giao xong từ trước.



---

### 3. `goalOrientedRobot` (Định hướng mục tiêu đơn lẻ)

* **Chiến lược**: Sử dụng BFS để tìm đường ngắn nhất đến gói hàng đầu tiên trong danh sách (`parcels[0]`).



```javascript
function goalOrientedRobot({place, parcels}, route) {
  if (route.length == 0) {
    let parcel = parcels[0];
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      route = findRoute(roadGraph, place, parcel.address);
    }
  }
  return {direction: route[0], memory: route.slice(1)};
}

```

* **Hạn chế cố hữu**:
* **Thiếu tầm nhìn toàn cục**: Luôn chọn `parcels[0]` làm mục tiêu mà không kiểm tra xem có gói hàng nào khác nằm ngay cạnh mình hay không.


* **Hành vi ngắt quãng**: Phải di chuyển ngang qua bản đồ để xử lý `parcels[0]`, vô tình đi qua điểm chứa gói hàng `parcels[1]` nhưng bỏ qua, sau đó lại phải quay ngược lại.




* **Hiệu suất**: ~16 bước trung bình.



---

### 4. `smarterRobot` (Tối ưu hóa đa mục tiêu & Ưu tiên hành động)

* **Giải pháp khắc phục**: Tính toán khoảng cách tới **TẤT CẢ** các gói hàng (cả việc nhặt lẫn việc giao) và chọn phương án có con đường ngắn nhất.



```javascript
function smarterRobot({place, parcels}, route) {
  if (route.length == 0) {
    let routes = parcels.map(parcel => {
      if (parcel.place != place) {
        return {
          route: findRoute(roadGraph, place, parcel.place),
          pickUp: true
        };
      } else {
        return {
          route: findRoute(roadGraph, place, parcel.address),
          pickUp: false
        };
      }
    });

    function score(a, b) {
      return (a.route.length - b.route.length) || (b.pickUp - a.pickUp);
    }
    
    route = routes.sort(score)[0].route;
  }
  
  return {direction: route[0], memory: route.slice(1)};
}

```

#### Phân tích hàm đánh giá trọng số `score(a, b)`:

1. **`a.route.length - b.route.length`**: Ưu tiên hàng đầu cho lộ trình có số bước ít nhất.


2. **`|| (b.pickUp - a.pickUp)`**: Khi hai lộ trình có chiều dài bằng nhau, phép tính logic `||` sẽ kích hoạt tiêu chí phụ:
* Nếu `a` là hành động nhặt (`pickUp = true` $\rightarrow$ giá trị 1) và `b` là hành động giao (`pickUp = false` $\rightarrow$ giá trị 0): `b.pickUp - a.pickUp` trả về $0 - 1 = -1$, xếp `a` lên trước.


* **Triết lý**: Khi độ dài đường đi bằng nhau, ưu tiên **NHẶT HÀNG** trước để thu gom được nhiều kiện hàng cùng lúc trên đường di chuyển, tối ưu hóa công suất chứa.





---

### 5. `bestRobot` (Tối ưu hóa chuỗi giao hàng dựa trên thuật toán TSP)

* **Vấn đề của `smarterRobot**`: Khi đã nhặt hết tất cả các gói hàng lên xe, `smarterRobot` chỉ chọn điểm giao gần nhất tại thời điểm tức thì (Greedy). Điều này có thể dẫn đến tổng quãng đường giao tất cả các đơn hàng bị dài hơn.


* **Giải pháp**: Phân chia chiến lược thành 2 giai đoạn:


1. **Giai đoạn còn hàng chưa nhặt**: Áp dụng chiến lược nhặt gần nhất giống `smarterRobot`.


2. **Giai đoạn đã nhặt hết hàng**: Sử dụng thuật toán **Nearest Neighbor TSP** (Láng giềng gần nhất cho Bài toán Người bán hàng) để lập kế hoạch cho một **chuỗi giao hàng nối tiếp hoàn chỉnh**.





```javascript
function bestRobot({place, parcels}, route) {
  if (route.length == 0) {
    let toPickUp = parcels.filter(p => p.place != place);
    let toDeliver = parcels.filter(p => p.place == place);

    if (toPickUp.length > 0) {
      let routes = parcels.map(parcel => {
        if (parcel.place != place) {
          return { route: findRoute(roadGraph, place, parcel.place), pickUp: true };
        } else {
          return { route: findRoute(roadGraph, place, parcel.address), pickUp: false };
        }
      });
      routes.sort((a, b) => (a.route.length - b.route.length) || (b.pickUp - a.pickUp));
      route = routes[0].route;
    } else {
      let deliveryAddresses = toDeliver.map(p => p.address);
      route = planDeliveryOrder(place, deliveryAddresses);
    }
  }
  return {direction: route[0], memory: route.slice(1)};
}

function planDeliveryOrder(currentPlace, addresses) {
  let fullRoute = [];
  let remaining = [...addresses];
  let pos = currentPlace;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestRoute = findRoute(roadGraph, pos, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      let candidateRoute = findRoute(roadGraph, pos, remaining[i]);
      if (candidateRoute.length < bestRoute.length) {
        bestIndex = i;
        bestRoute = candidateRoute;
      }
    }

    fullRoute = fullRoute.concat(bestRoute);
    pos = remaining[bestIndex];
    remaining.splice(bestIndex, 1);
  }

  return fullRoute;
}

```

#### Nguyên lý thuật toán Nearest Neighbor TSP trong `planDeliveryOrder`:

1. Từ vị trí hiện tại `pos`, tìm điểm giao gần nhất trong danh sách `remaining`.


2. Nối lộ trình đến điểm đó vào `fullRoute`.


3. Cập nhật vị trí hiện tại `pos` chính là điểm vừa đến.


4. Loại bỏ điểm đó khỏi danh sách `remaining` bằng `.splice(bestIndex, 1)`.


5. Lặp lại cho đến khi `remaining` rỗng. Kết quả thu được là một chuỗi lộ trình nối tiếp liên tục tối ưu toàn bộ chặng giao.



---

## IV. BÀI TẬP BỔ SUNG & HỆ THỐNG ĐO LƯỜNG HIỆU SUẤT

### 1. Exercise 1: Measuring a Robot (Đo lường & Kiểm thử Thống kê)

Để so sánh năng lực giữa các thuật toán một cách khách quan, hệ thống cần kiểm soát biến số môi trường bằng cách chạy thử nghiệm trên cùng các bài toán ngẫu nhiên.

```javascript
function countSteps(state, robot, memory) {
  for (let steps = 0;; steps++) {
    if (state.parcels.length == 0) return steps;
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
  }
}

function compareRobots(robot1, memory1, robot2, memory2) {
  let total1 = 0, total2 = 0;
  for (let i = 0; i < 100; i++) {
    let state = VillageState.random();
    total1 += countSteps(state, robot1, memory1);
    total2 += countSteps(state, robot2, memory2);
  }
  console.log(`Robot 1 trung bình: ${total1 / 100} bước`);
  console.log(`Robot 2 trung bình: ${total2 / 100} bước`);
}

```

* **Phương pháp kiểm thử chuẩn xác**: Trong mỗi vòng lặp `i`, một trạng thái `state` ngẫu nhiên duy nhất được tạo ra từ `VillageState.random()`. **Cả hai rô-bốt đều phải giải quyết cùng một bản sao `state` này**.


* **Ý nghĩa**: Điều này loại bỏ hoàn toàn yếu tố may rủi do khởi tạo vị trí hàng hóa, đảm bảo dữ liệu so sánh có độ tin cậy thống kê cao.



---

### 2. Exercise 3: Persistent Group (`PGroup` - Tập hợp Bất biến)

Bài tập yêu cầu xây dựng một cấu trúc dữ liệu kiểu Tập hợp (`Set`) nhưng tuân theo nguyên lý **Bất biến (Immutability)** giống như cách `VillageState` đã được thiết kế.

```javascript
class PGroup {
  constructor(members) {
    this.members = members;
  }

  add(value) {
    if (this.has(value)) return this;
    return new PGroup(this.members.concat([value]));
  }

  delete(value) {
    if (!this.has(value)) return this;
    return new PGroup(this.members.filter(m => m !== value));
  }

  has(value) {
    return this.members.includes(value);
  }
}

PGroup.empty = new PGroup([]);

```

#### Phân tích cấu trúc `PGroup`:

* **`add(value)`**: Nếu giá trị đã có mặt, hàm trả về nguyên đối tượng hiện tại `this` để tiết kiệm tài nguyên. Nếu chưa có, hàm dùng `.concat()` để tạo ra mảng mới và trả về một đối tượng `new PGroup(...)` mới.


* **`delete(value)`**: Dùng `.filter()` tạo mảng mới đã loại bỏ `value`, sau đó đóng gói trong một instance `PGroup` mới.


* **Mẫu thiết kế Singleton cho `PGroup.empty**`: Do tính chất bất biến, mọi đối tượng `PGroup` rỗng đều có trạng thái hoàn toàn giống nhau. Việc chỉ tạo duy nhất một thể hiện `PGroup.empty` giúp tối ưu hóa bộ nhớ và được dùng làm điểm khởi đầu cho mọi chuỗi thao tác.



---

## V. TỔNG KẾT BẢNG SO SÁNH HIỆU SUẤT CÁC RÔ-BỐT

| Bộ não Rô-bốt | Chiến thuật chính | Số bước trung bình (100 lần thử) | Ưu điểm | Nhược điểm |
| --- | --- | --- | --- | --- |
| **`randomRobot`** | Lựa chọn hướng đi ngẫu nhiên

 | ~63 bước

 | Cực kỳ đơn giản, không tốn bộ nhớ

 | Bị lặp vô hạn, hiệu suất cực kém

 |
| **`routeRobot`** | Đi theo tuyến đường cố định `mailRoute`<br> | ~18 bước

 | Đảm bảo phủ hết bản đồ, không bỏ sót hàng

 | Dư thừa bước đi, không linh hoạt theo vị trí hàng

 |
| **`goalOrientedRobot`** | Dùng BFS nhắm vào gói hàng `parcels[0]`<br> | ~16 bước

 | Luôn chọn đường ngắn nhất tới mục tiêu đơn

 | Bị tầm nhìn hẹp, dễ chạy qua chạy lại giữa bản đồ

 |
| **`smarterRobot`** | So sánh đường đi tất cả các gói + Ưu tiên nhặt

 | ~12 - 13 bước

 | Chọn mục tiêu tối ưu ngắn nhất ở từng bước

 | Chưa tối ưu hoàn hảo chuỗi giao hàng ở giai đoạn cuối

 |
| **`bestRobot`** | Phân Phase: Nhặt gần nhất + Nearest Neighbor TSP

 | **Tối ưu nhất (<12 bước)**<br> | Lập lộ trình giao hàng liên tục hoàn chỉnh

 | Đỏi hỏi chi phí tính toán cao hơn ở mỗi lượt

 |
