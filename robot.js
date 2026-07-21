// ╔══════════════════════════════════════════════════════════════════════╗
// ║  ELOQUENT JAVASCRIPT - CHAPTER 7: PROJECT A ROBOT                  ║
// ║  Hoàn thiện toàn bộ code + 3 Exercises                            ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ==========================================
// 1. KHỞI TẠO BẢN ĐỒ LÀNG MEADOWFIELD (roadGraph)
// ==========================================

// Danh sách các con đường nối giữa các địa điểm trong làng Meadowfield
const roads = [
  "Alice's House-Bob's House",   "Alice's House-Cabin",
  "Alice's House-Post Office",   "Bob's House-Town Hall",
  "Daria's House-Ernie's House", "Daria's House-Town Hall",
  "Ernie's House-Grete's House", "Grete's House-Farm",
  "Grete's House-Shop",          "Marketplace-Farm",
  "Marketplace-Post Office",     "Marketplace-Shop",
  "Marketplace-Town Hall",       "Shop-Town Hall"
];

/**
 * Hàm xây dựng đồ thị từ danh sách các con đường (cạnh).
 * Sử dụng phong cách Functional Programming, không làm thay đổi dữ liệu đầu vào.
 * Trả về một đối tượng (Map-like) lưu danh sách các điểm kề của từng địa điểm.
 */
function buildGraph(edges) {
  let graph = Object.create(null);
  
  function addEdge(from, to) {
    if (from in graph) {
      graph[from].push(to);
    } else {
      graph[from] = [to];
    }
  }
  
  // Duyệt qua các cạnh, tách thành điểm đầu-cuối và thêm vào đồ thị 2 chiều
  for (let [from, to] of edges.map(r => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

const roadGraph = buildGraph(roads);

// ==========================================
// 2. KHỞI TẠO TRẠNG THÁI LÀNG (VillageState)
// ==========================================

/**
 * Lớp đại diện cho trạng thái của ngôi làng tại một thời điểm.
 * Thiết kế theo nguyên lý Bất Biến (Immutability) của Functional Programming:
 * Mọi hành động di chuyển (move) không chỉnh sửa trực tiếp đối tượng hiện tại,
 * mà trả về một thực thể VillageState hoàn toàn mới.
 */
class VillageState {
  constructor(place, parcels) {
    this.place = place;     // Vị trí hiện tại của robot
    this.parcels = parcels; // Danh sách các gói hàng: [{place, address}]
  }

  /**
   * Phương thức di chuyển robot đến điểm tiếp theo (destination).
   * @param {string} destination - Điểm robot muốn đi tới
   * @returns {VillageState} Trạng thái mới của làng sau khi di chuyển
   */
  move(destination) {
    // Nếu điểm đến không có đường nối trực tiếp với vị trí hiện tại, không làm gì cả
    if (!roadGraph[this.place].includes(destination)) {
      return this;
    } else {
      // 1. Cập nhật vị trí của các gói hàng đang được robot mang theo (ở cùng vị trí với robot)
      // 2. Lọc bỏ (filter) các gói hàng đã được giao thành công (vị trí trùng với địa chỉ giao hàng)
      let parcels = this.parcels.map(p => {
        if (p.place != this.place) return p;
        return {place: destination, address: p.address};
      }).filter(p => p.place != p.address);

      return new VillageState(destination, parcels);
    }
  }
}

// ==========================================
// 3. HÀM HỖ TRỢ
// ==========================================

function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length);
  return array[choice];
}

// Tạo ngẫu nhiên một danh sách các gói hàng để chạy thử
VillageState.random = function(parcelCount = 5) {
  let parcels = [];
  for (let i = 0; i < parcelCount; i++) {
    let address = randomPick(Object.keys(roadGraph));
    let place;
    do {
      place = randomPick(Object.keys(roadGraph));
    } while (place == address); // Vị trí gói hàng không được trùng với địa chỉ giao
    parcels.push({place, address});
  }
  return new VillageState("Post Office", parcels);
};

// ==========================================
// 4. THUẬT TOÁN TÌM ĐƯỜNG NGẮN NHẤT (BFS - Breadth-First Search)
// ==========================================

/**
 * Thuật toán BFS tìm đường đi ngắn nhất từ A (from) đến B (to) trên roadGraph.
 * 
 * NGUYÊN LÝ HOẠT ĐỘNG CỦA BFS:
 * - BFS khám phá đồ thị theo từng lớp (chiều rộng). Nó kiểm tra tất cả các nút
 *   cách điểm xuất phát 1 bước đi, sau đó là 2 bước đi, rồi 3 bước đi...
 * - Do đó, con đường đầu tiên tìm thấy nối từ 'from' tới 'to' chắc chắn sẽ là
 *   con đường có số bước đi ngắn nhất.
 * - Sử dụng một "hàng đợi" (queue/work list) để lưu các nút đang khám phá, 
 *   mỗi phần tử lưu vị trí hiện tại và lộ trình (route) đã đi qua.
 * - Sử dụng kỹ thuật kiểm tra trùng lặp để tránh robot bị lặp vô hạn (đi vòng quanh).
 */
function findRoute(graph, from, to) {
  // Hàng đợi lưu thông tin các điểm sẽ duyệt tiếp theo.
  // Mỗi phần tử có cấu trúc: { at: "vị trí hiện tại", route: ["các bước đã đi"] }
  let work = [{at: from, route: []}];
  
  for (let i = 0; i < work.length; i++) {
    let {at, route} = work[i];
    
    // Duyệt qua tất cả các điểm lân cận kề với điểm đang xét
    for (let place of graph[at]) {
      // Nếu tìm thấy điểm đích, lập tức trả về lộ trình mới đã cộng thêm bước đi này
      if (place == to) return route.concat(place);
      
      // Nếu địa điểm này chưa từng xuất hiện trong danh sách hàng đợi (tránh đi vòng tròn)
      if (!work.some(w => w.at == place)) {
        // Thêm điểm này vào hàng đợi để tiếp tục duyệt ở các vòng lặp sau
        work.push({at: place, route: route.concat(place)});
      }
    }
  }
}

// ==========================================
// 5. CÁC BỘ NÃO ROBOT (TỪ ĐƠN GIẢN ĐẾN THÔNG MINH)
// ==========================================

// ── ROBOT 1: randomRobot ─────────────────────
// Chiến lược: Đi ngẫu nhiên, không có bộ nhớ
// Hiệu suất trung bình: ~63 lượt (rất tệ)
function randomRobot(state) {
  return {direction: randomPick(roadGraph[state.place])};
}

// ── ROBOT 2: routeRobot ──────────────────────
// Chiến lược: Đi theo lộ trình cố định đi qua tất cả địa điểm
// Hiệu suất trung bình: ~18 lượt (tốt hơn nhiều, tối đa 26 lượt)
const mailRoute = [
  "Alice's House", "Cabin", "Alice's House", "Bob's House",
  "Town Hall", "Daria's House", "Ernie's House",
  "Grete's House", "Shop", "Grete's House", "Farm",
  "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return {direction: memory[0], memory: memory.slice(1)};
}

// ── ROBOT 3: goalOrientedRobot ───────────────
// Chiến lược: Dùng BFS tìm đường ngắn nhất đến gói hàng ĐẦU TIÊN trong danh sách
// Hiệu suất trung bình: ~16 lượt
//
// ⚠️ ĐIỂM YẾU CỦA ROBOT NÀY:
// - Luôn lấy gói hàng ĐẦU TIÊN trong danh sách (parcels[0]) mà KHÔNG xem xét 
//   gói nào gần nhất.
// - Thường phải đi qua đi lại xuyên làng vì gói hàng nó chọn nằm ở phía bên kia 
//   bản đồ, trong khi có gói khác ở ngay bên cạnh.
// - Không phân biệt ưu tiên giữa việc NHẶT hàng (pick up) và GIAO hàng (deliver).
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


// ╔══════════════════════════════════════════════════════════════════════╗
// ║                        EXERCISES                                   ║
// ╚══════════════════════════════════════════════════════════════════════╝


// ==========================================
// EXERCISE 1: Measuring a Robot (Đo lường hiệu suất Robot)
// ==========================================

/**
 * Hàm countSteps - Biến thể của runRobot, TRẢ VỀ SỐ BƯỚC thay vì in ra console.
 * Dùng để đo lường hiệu suất robot một cách khách quan.
 */
function countSteps(state, robot, memory) {
  for (let steps = 0;; steps++) {
    if (state.parcels.length == 0) return steps;
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
  }
}

/**
 * Hàm compareRobots - So sánh 2 robot trên CÙNG 100 bài kiểm tra.
 * 
 * ĐIỂM QUAN TRỌNG:
 * - Cả 2 robot đều nhận CÙNG MỘT task (cùng trạng thái ban đầu) để đảm bảo 
 *   sự công bằng. Nếu mỗi robot nhận task ngẫu nhiên riêng, kết quả có thể 
 *   bị lệch do may rủi.
 * - Chạy 100 lần để có trung bình thống kê đủ đáng tin cậy.
 */
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


// ==========================================
// EXERCISE 2: Robot Efficiency (Robot hiệu quả hơn)
// ==========================================

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  smarterRobot - BỘ NÃO CẢI TIẾN SO VỚI goalOrientedRobot       ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  3 CẢI TIẾN CHÍNH:                                               ║
 * ║                                                                   ║
 * ║  1) XÉT TẤT CẢ GÓI HÀNG, CHỌN GÓI GẦN NHẤT                   ║
 * ║     goalOrientedRobot luôn chọn parcels[0] (gói đầu tiên)       ║
 * ║     → Thường phải đi xa không cần thiết.                         ║
 * ║     smarterRobot tính đường đi tới TẤT CẢ các gói hàng,        ║
 * ║     rồi chọn gói có đường đi NGẮN NHẤT.                         ║
 * ║                                                                   ║
 * ║  2) ƯU TIÊN NHẶT HÀNG HƠN GIAO HÀNG (KHI CÙNG KHOẢNG CÁCH)   ║
 * ║     Nếu có 2 lộ trình cùng độ dài, ưu tiên đi NHẶT gói hàng   ║
 * ║     hơn là đi GIAO. Lý do: nhặt hàng trước giúp "gom" nhiều   ║
 * ║     gói hàng rồi giao dọc đường, tiết kiệm bước đi tổng thể.  ║
 * ║                                                                   ║
 * ║  3) TÍNH TOÁN LẠI MỖI BƯỚC (KHI HẾT ROUTE)                     ║
 * ║     Khi hoàn thành 1 lộ trình, robot tính toán lại từ đầu,      ║
 * ║     xem xét lại toàn bộ tình hình thay vì cứng nhắc bám theo   ║
 * ║     kế hoạch cũ.                                                  ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */
function smarterRobot({place, parcels}, route) {
  if (route.length == 0) {
    // Tính đường đi tới TẤT CẢ các gói hàng (cả nhặt lẫn giao)
    let routes = parcels.map(parcel => {
      if (parcel.place != place) {
        // Gói hàng chưa nhặt → tìm đường đến nơi chứa gói hàng
        return {
          route: findRoute(roadGraph, place, parcel.place),
          pickUp: true  // Đánh dấu đây là hành động NHẶT hàng
        };
      } else {
        // Gói hàng đã nhặt → tìm đường đến địa chỉ giao
        return {
          route: findRoute(roadGraph, place, parcel.address),
          pickUp: false // Đánh dấu đây là hành động GIAO hàng
        };
      }
    });

    // ── CHIẾN LƯỢC CHỌN LỘ TRÌNH TỐI ƯU ──
    // Sắp xếp theo 2 tiêu chí (ưu tiên từ trên xuống):
    //   1. Đường đi NGẮN nhất lên đầu
    //   2. Nếu cùng độ dài, ưu tiên NHẶT hàng (pickUp=true) hơn GIAO hàng
    //
    // Giải thích logic score:
    //   - a.route.length - b.route.length: đường ngắn hơn ưu tiên hơn
    //   - Nếu bằng nhau (=0): so sánh pickUp
    //     - a.pickUp=true, b.pickUp=false → a lên trước (trả về -1)
    //     - a.pickUp=false, b.pickUp=true → b lên trước (trả về 1)
    //     - Cùng loại → giữ nguyên (trả về 0)
    function score(a, b) {
      return (a.route.length - b.route.length) || (b.pickUp - a.pickUp);
    }
    
    route = routes.sort(score)[0].route;
  }
  
  return {direction: route[0], memory: route.slice(1)};
}


// ==========================================
// EXERCISE 2b: bestRobot — Tối ưu thứ tự GIAO HÀNG
// ==========================================

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  bestRobot — CẢI TIẾN THÊM SO VỚI smarterRobot                 ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  ĐIỂM YẾU CÒN LẠI CỦA smarterRobot:                            ║
 * ║  Khi đã nhặt hết hàng, smarterRobot chỉ chọn điểm giao GẦN    ║
 * ║  NHẤT tại thời điểm hiện tại (greedy tức thì). Nó KHÔNG xem    ║
 * ║  xét rằng sau khi giao gói A, vị trí mới có THỂ gần gói B     ║
 * ║  hơn nhiều → tổng đường đi chưa tối ưu.                         ║
 * ║                                                                   ║
 * ║  VÍ DỤ:                                                           ║
 * ║  Robot ở Shop, cần giao tới: Farm (2 bước), Bob's House (2),   ║
 * ║  Ernie's House (3). smarterRobot chọn Farm trước vì gần nhất.  ║
 * ║  Nhưng nếu giao Bob's House trước → rồi Farm → Ernie's House   ║
 * ║  tổng đường đi có thể ngắn hơn vì các điểm NỐI TIẾP nhau.     ║
 * ║                                                                   ║
 * ║  CẢI TIẾN:                                                        ║
 * ║  4) KHI ĐÃ NHẶT HẾT HÀNG → DÙNG NEAREST NEIGHBOR TSP          ║
 * ║     Tính TOÀN BỘ chuỗi giao hàng theo thuật toán Nearest        ║
 * ║     Neighbor: từ vị trí hiện tại, chọn điểm giao gần nhất,     ║
 * ║     rồi từ điểm đó chọn điểm giao gần nhất tiếp theo...        ║
 * ║     → Tối ưu TỔNG quãng đường thay vì chỉ bước tiếp theo.     ║
 * ║                                                                   ║
 * ║  5) KHI CÒN HÀNG CHƯA NHẶT → VẪN ƯU TIÊN NHẶT GẦN NHẤT      ║
 * ║     Giữ nguyên chiến lược ưu tiên nhặt hàng từ smarterRobot.   ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */
function bestRobot({place, parcels}, route) {
  if (route.length == 0) {
    // Phân loại gói hàng thành 2 nhóm
    let toPickUp = parcels.filter(p => p.place != place);   // Chưa nhặt
    let toDeliver = parcels.filter(p => p.place == place);  // Đã nhặt, cần giao

    if (toPickUp.length > 0) {
      // ── CÒN GÓI CHƯA NHẶT: ưu tiên nhặt gói gần nhất ──
      // (giống smarterRobot: ưu tiên pickUp > deliver khi cùng khoảng cách)
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
      routes.sort((a, b) => (a.route.length - b.route.length) || (b.pickUp - a.pickUp));
      route = routes[0].route;

    } else {
      // ══════════════════════════════════════════════════════════
      //  ĐÃ NHẶT HẾT HÀNG → TỐI ƯU THỨ TỰ GIAO HÀNG
      //  Sử dụng Nearest Neighbor TSP (Bài toán Người bán hàng)
      // ══════════════════════════════════════════════════════════
      //
      //  THUẬT TOÁN NEAREST NEIGHBOR TSP:
      //  1. Từ vị trí hiện tại, tìm điểm giao gần nhất → đi tới đó
      //  2. Từ điểm giao vừa đến, tìm điểm giao gần nhất CHƯA ĐI → đi tiếp
      //  3. Lặp lại cho đến khi giao hết
      //  4. Nối tất cả các đoạn đường lại thành 1 route liền mạch
      //
      //  VÍ DỤ MINH HỌA:
      //  Robot ở Shop, cần giao: [Farm, Bob's House, Ernie's House]
      //
      //  Bước 1: Shop → Farm (1 bước), Shop → Bob's (3), Shop → Ernie's (3)
      //          → Chọn Farm (gần nhất)
      //  Bước 2: Farm → Bob's (4), Farm → Ernie's (3)
      //          → Chọn Ernie's House  
      //  Bước 3: Ernie's → Bob's (3)
      //          → Chọn Bob's House
      //  Tổng route: Shop → Farm → Ernie's → Bob's
      //
      //  So với smarterRobot (greedy từng bước):
      //  smarterRobot cũng chọn Farm trước, nhưng rồi tính lại và có thể
      //  chọn Bob's House tiếp (vì nó không nhìn toàn cảnh chuỗi giao hàng).
      //  bestRobot nhìn TOÀN BỘ chuỗi nên tối ưu hơn.

      let deliveryAddresses = toDeliver.map(p => p.address);
      route = planDeliveryOrder(place, deliveryAddresses);
    }
  }
  return {direction: route[0], memory: route.slice(1)};
}

/**
 * Lập kế hoạch thứ tự giao hàng tối ưu bằng Nearest Neighbor TSP.
 * 
 * @param {string} currentPlace - Vị trí hiện tại của robot
 * @param {string[]} addresses - Danh sách các địa chỉ cần giao
 * @returns {string[]} Route liền mạch đi qua tất cả các địa chỉ giao hàng
 */
function planDeliveryOrder(currentPlace, addresses) {
  let fullRoute = [];
  let remaining = [...addresses]; // Copy để không sửa mảng gốc
  let pos = currentPlace;

  while (remaining.length > 0) {
    // Tìm địa chỉ giao gần nhất từ vị trí hiện tại
    let bestIndex = 0;
    let bestRoute = findRoute(roadGraph, pos, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      let candidateRoute = findRoute(roadGraph, pos, remaining[i]);
      if (candidateRoute.length < bestRoute.length) {
        bestIndex = i;
        bestRoute = candidateRoute;
      }
    }

    // Nối đoạn đường tới điểm giao gần nhất vào route tổng
    fullRoute = fullRoute.concat(bestRoute);
    // Cập nhật vị trí hiện tại
    pos = remaining[bestIndex];
    // Xoá điểm giao đã xử lý khỏi danh sách
    remaining.splice(bestIndex, 1);
  }

  return fullRoute;
}


// ==========================================
// EXERCISE 3: Persistent Group (Nhóm Bất Biến)
// ==========================================

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  PGroup - Cấu trúc dữ liệu Nhóm Bất Biến (Persistent Group)   ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  KHÁI NIỆM:                                                      ║
 * ║  PGroup giống như Set nhưng tuân theo nguyên tắc BẤT BIẾN        ║
 * ║  (Immutability). Mọi thao tác add/delete đều TRẢ VỀ BẢN MỚI    ║
 * ║  mà không thay đổi bản gốc.                                      ║
 * ║                                                                   ║
 * ║  TẠI SAO CHỈ CẦN MỘT PGroup.empty DUY NHẤT?                    ║
 * ║  Vì PGroup là bất biến, mọi PGroup rỗng đều giống hệt nhau     ║
 * ║  và không bao giờ bị thay đổi. Không có lý do gì phải tạo      ║
 * ║  nhiều bản sao rỗng vì chúng sẽ luôn giống nhau.               ║
 * ║                                                                   ║
 * ║  TƯƠNG TỰ NHƯ: VillageState.move() cũng trả về state mới      ║
 * ║  mà không thay đổi state cũ → cùng triết lý thiết kế.          ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */
class PGroup {
  constructor(members) {
    this.members = members; // Mảng lưu các giá trị thành viên (không bao giờ bị sửa đổi)
  }

  /**
   * Thêm một giá trị vào nhóm → trả về PGroup MỚI
   * Nếu giá trị đã tồn tại thì trả về chính PGroup hiện tại (không tạo bản mới vô ích)
   */
  add(value) {
    if (this.has(value)) return this;
    return new PGroup(this.members.concat([value]));
  }

  /**
   * Xoá một giá trị khỏi nhóm → trả về PGroup MỚI (filter ra giá trị cần xoá)
   * PGroup gốc hoàn toàn không bị ảnh hưởng.
   */
  delete(value) {
    if (!this.has(value)) return this;
    return new PGroup(this.members.filter(m => m !== value));
  }

  /**
   * Kiểm tra xem giá trị có tồn tại trong nhóm không
   */
  has(value) {
    return this.members.includes(value);
  }
}

// PGroup rỗng dùng làm điểm khởi đầu cho mọi PGroup.
// Chỉ cần DUY NHẤT MỘT instance vì nó bất biến.
PGroup.empty = new PGroup([]);


// ╔══════════════════════════════════════════════════════════════════════╗
// ║                     CHẠY VÀ SO SÁNH                               ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ==========================================
// 6. HÀM CHẠY THỬ NGHIỆM SIMULATION
// ==========================================

/**
 * Hàm mô phỏng chạy robot cho đến khi giao hết mọi gói hàng.
 */
function runRobot(state, robot, memory) {
  let turn = 0;
  for (;; turn++) {
    if (state.parcels.length == 0) {
      console.log(`\n-> ĐÃ GIAO HẾT HÀNG! Tổng số lượt đi: ${turn} lượt.\n`);
      break;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
    console.log(`Lượt ${turn + 1}: Di chuyển tới ${action.direction} (Gói hàng còn lại: ${state.parcels.length})`);
  }
  return turn;
}

// ── CHẠY MÔ PHỎNG TRỰC QUAN ──
console.log("╔══════════════════════════════════════════════════╗");
console.log("║     ELOQUENT JS - CHAPTER 7: ROBOT PROJECT     ║");
console.log("╚══════════════════════════════════════════════════╝\n");

const testState = VillageState.random(5);
console.log("Vị trí xuất phát: Post Office");
console.log("Danh sách gói hàng ban đầu:", JSON.stringify(testState.parcels, null, 2));

console.log("\n────── goalOrientedRobot (Robot gốc) ──────");
runRobot(testState, goalOrientedRobot, []);

console.log("\n────── smarterRobot (Robot cải tiến) ──────");
runRobot(testState, smarterRobot, []);

console.log("\n────── bestRobot (Robot tối ưu giao hàng) ──────");
runRobot(testState, bestRobot, []);

// ── SO SÁNH THỐNG KÊ 100 LẦN ──
console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║   SO SÁNH HIỆU SUẤT TẤT CẢ ROBOT (trung bình 100 lần)    ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

console.log("📊 routeRobot vs goalOrientedRobot:");
compareRobots(routeRobot, [], goalOrientedRobot, []);

console.log("\n📊 goalOrientedRobot vs smarterRobot:");
compareRobots(goalOrientedRobot, [], smarterRobot, []);

console.log("\n📊 smarterRobot vs bestRobot:");
compareRobots(smarterRobot, [], bestRobot, []);

console.log("\n📊 goalOrientedRobot vs bestRobot:");
compareRobots(goalOrientedRobot, [], bestRobot, []);

console.log("\n📊 routeRobot vs bestRobot:");
compareRobots(routeRobot, [], bestRobot, []);

// ── KIỂM THỬ PGroup ──
console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║      EXERCISE 3: KIỂM THỬ PGroup               ║");
console.log("╚══════════════════════════════════════════════════╝\n");

let a = PGroup.empty.add("a");
let ab = a.add("b");
let b = ab.delete("a");

console.log('b.has("b"):', b.has("b"));   // → true
console.log('a.has("b"):', a.has("b"));   // → false  (a không bị ảnh hưởng khi tạo ab)
console.log('b.has("a"):', b.has("a"));   // → false  (a đã bị xoá khỏi b)
console.log('ab.has("a"):', ab.has("a")); // → true   (ab vẫn nguyên vẹn dù b = ab.delete("a"))
console.log('ab.has("b"):', ab.has("b")); // → true   (ab vẫn nguyên vẹn)

console.log("\n✅ PGroup hoạt động đúng nguyên tắc Bất Biến:");
console.log("   - add() tạo PGroup MỚI, không sửa PGroup cũ");
console.log("   - delete() tạo PGroup MỚI, không sửa PGroup cũ");
console.log("   - Mọi phiên bản cũ vẫn giữ nguyên dữ liệu của mình");
