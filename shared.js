/* ============================================================
   shared.js
   Menu data + localStorage order helpers shared by
   customer.html (ordering screen) and kitchen.html (restaurant computer)
   ============================================================ */

const MENU = [
  { id: 1,  cat: "Kebabs & Starters", name: "Galouti Kebab",        desc: "Melt-in-mouth minced mutton kebab, 30+ spices, warm roomali roti.", price: 320, veg: false, image: "food-img/galauti kebab.jpg" },
  { id: 2,  cat: "Kebabs & Starters", name: "Kakori Kebab",         desc: "Skewer-grilled mutton seekh, silken texture, saffron rub.",         price: 340, veg: false, image: "food-img/kakori kebab.jpg" },
  { id: 3,  cat: "Kebabs & Starters", name: "Paneer Shashlik Tikka",desc: "Char-grilled paneer, bell pepper, tandoori masala.",                price: 260, veg: true,  image: "food-img/panner shashlik tikka.jpg" },
  { id: 4,  cat: "Kebabs & Starters", name: "Murgh Malai Tikka",    desc: "Cream & cheese marinated chicken, charcoal finish.",                price: 290, veg: false, image: "food-img/murgh malai tikka.jpg" },

  { id: 5,  cat: "Biryani & Rice", name: "Awadhi Dum Mutton Biryani", desc: "Slow dum-cooked basmati, tender mutton, kewra fragrance.", price: 420, veg: false, image: "food-img/awadhi dum mutton biryani.jpg" },
  { id: 6,  cat: "Biryani & Rice", name: "Lucknowi Chicken Biryani",  desc: "Layered rice and chicken, sealed and dum-cooked.",         price: 360, veg: false, image: "food-img/lucknowi chicken biryani.jpg" },
  { id: 7,  cat: "Biryani & Rice", name: "Vegetable Yakhni Pulao",    desc: "Seasonal vegetables in a light aromatic stock rice.",      price: 260, veg: true,  image: "food-img/vegetable yakhni pulao.jpg" },

  { id: 8,  cat: "Curries", name: "Nihari",           desc: "Slow-simmered mutton shank stew, overnight cooked.", price: 380, veg: false, image: "food-img/nihari.jpg" },
  { id: 9,  cat: "Curries", name: "Dal Bukhara",      desc: "Black lentils, butter and cream, simmered for hours.", price: 240, veg: true,  image: "food-img/Dal Bukhara.jpg" },
  { id: 10, cat: "Curries", name: "Paneer Lababdar",  desc: "Paneer in a velvety tomato-cashew gravy.", price: 270, veg: true,  image: "food-img/panner lababdar.jpg" },

  { id: 11, cat: "Breads", name: "Sheermal",       desc: "Saffron-milk sweetened flatbread, tandoor baked.", price: 80, veg: true, image: "food-img/sheermaal.jpg" },
  { id: 12, cat: "Breads", name: "Roomali Roti",   desc: "Paper-thin handkerchief bread, made to order.",    price: 40, veg: true, image: "food-img/roomali roti.jpg" },
  { id: 13, cat: "Breads", name: "Warqi Paratha",  desc: "Multi-layered flaky paratha, ghee roasted.",       price: 70, veg: true, image: "food-img/warqi paratha.jpg" },

  { id: 14, cat: "Desserts", name: "Shahi Tukda",     desc: "Fried bread soaked in saffron rabri, nuts.", price: 150, veg: true, image: "food-img/Shahi Tukda.png" },
  { id: 15, cat: "Desserts", name: "Kulfi Falooda",   desc: "Pistachio kulfi, vermicelli, rose syrup.",   price: 130, veg: true, image: "food-img/kulfi falooda.png" },

  { id: 16, cat: "Beverages", name: "Sharbat-e-Gulab",  desc: "Rose petal cooler, chilled.",              price: 90, veg: true, image: "food-img/sharbat-e-gulab.jpg" },
  { id: 17, cat: "Beverages", name: "Kashmiri Kahwa",   desc: "Saffron-cardamom spiced tea, served warm.", price: 80, veg: true, image: "food-img/kashmiri kahwa.jpg" },
];

const STORAGE_KEY = "awadh_dinein_orders";

/** Read all orders from storage (oldest first). */
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/** Overwrite the full orders list. */
function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

/** Append a new order. Order: {id, number, table, items, total, status, time} */
function addOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

/** Update just the status of one order: 'pending' | 'preparing' | 'served' */
function updateOrderStatus(id, status) {
  const orders = getOrders();
  const o = orders.find((o) => o.id === id);
  if (o) {
    o.status = status;
    saveOrders(orders);
  }
}

/** Remove an order entirely (e.g. after it's been served and cleared). */
function removeOrder(id) {
  saveOrders(getOrders().filter((o) => o.id !== id));
}

/** Next human-friendly ticket number, per day. */
function nextOrderNumber() {
  const orders = getOrders();
  return orders.length ? Math.max(...orders.map((o) => o.number)) + 1 : 1;
}

// ---------------------------Coupon codes and discounts-----------------------------------------
const COUPONS = [
  { code: "WELCOME10", discount: 0.10 }, // 10% discount
  { code: "FESTIVE20", discount: 0.20 }, // 20% discount
  { code: "VIP30", discount: 0.30 }      // 30% discount
];

/** Apply a coupon code to the total amount. Returns the discounted total or null if invalid. */
function applyCoupon(code, total) {
  const coupon = COUPONS.find((c) => c.code === code.toUpperCase());
  if (coupon) {
    return total - (total * coupon.discount);
  }
  return null; // Invalid coupon
}