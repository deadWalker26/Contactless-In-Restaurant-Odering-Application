/* ============================================================
   customer.js — dine-in ordering screen logic
   Relies on MENU, addOrder, nextOrderNumber from shared.js
   ============================================================ */

const CATEGORIES = [...new Set(MENU.map((m) => m.cat))];
const cart = {}; // id -> qty
let appliedCouponCode = null;

// ---------- Render category tabs ----------
const tabsEl = document.getElementById("tabs");
CATEGORIES.forEach((cat, i) => {
  const btn = document.createElement("button");
  btn.textContent = cat;
  if (i === 0) btn.classList.add("active");
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("cat-" + cat.replace(/\s+/g, "-")).scrollIntoView({ behavior: "smooth", block: "start" });
  });
  tabsEl.appendChild(btn);
});

// ---------- Render menu ----------
const menuEl = document.getElementById("menu");
CATEGORIES.forEach((cat) => {
  const title = document.createElement("h2");
  title.className = "category-title";
  title.id = "cat-" + cat.replace(/\s+/g, "-");
  title.textContent = cat;
  menuEl.appendChild(title);

  MENU.filter((m) => m.cat === cat).forEach((item) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item-img-wrap">
        <img class="item-img" src="${item.image || ''}" alt="${item.name}">
      </div>
      <div class="item-info">
        <div class="item-name-row">
          <span class="dot ${item.veg ? "" : "nonveg"}"></span>
          <span class="item-name">${item.name}</span>
        </div>
        <div class="item-desc">${item.desc}</div>
        <div class="item-price">₹${item.price}</div>
      </div>
      <div class="item-actions" id="actions-${item.id}"></div>
    `;
    menuEl.appendChild(row);
    renderItemActions(item.id);
  });
});

function renderItemActions(id) {
  const el = document.getElementById("actions-" + id);
  const qty = cart[id] || 0;
  if (qty === 0) {
    el.innerHTML = `<button class="add-btn" onclick="addItem(${id})">Add +</button>`;
  } else {
    el.innerHTML = `
      <div class="stepper">
        <button onclick="decItem(${id})">−</button>
        <span>${qty}</span>
        <button onclick="addItem(${id})">+</button>
      </div>`;
  }
}

function addItem(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderItemActions(id);
  renderCart();
}
function decItem(id) {
  if (!cart[id]) return;
  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];
  renderItemActions(id);
  renderCart();
}

function renderCart() {
  const body = document.getElementById("cartBody");
  const ids = Object.keys(cart);
  const totalItems = ids.reduce((s, id) => s + cart[id], 0);
  document.getElementById("cartCount").textContent = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;

  if (ids.length === 0) {
    body.innerHTML = `<div class="cart-empty">Your dastarkhwan is empty —<br>add something delicious.</div>`;
  } else {
    body.innerHTML = ids
      .map((id) => {
        const item = MENU.find((m) => m.id == id);
        return `
          <div class="cart-line">
            <div>
              <div class="name">${item.name}</div>
              <div style="color:#8A7A6E;">₹${item.price} × ${cart[id]}</div>
            </div>
            <div class="line-controls">
              <button onclick="decItem(${id})">−</button>
              <span>${cart[id]}</span>
              <button onclick="addItem(${id})">+</button>
            </div>
          </div>`;
      })
      .join("");
  }

  const total = ids.reduce((s, id) => s + cart[id] * MENU.find((m) => m.id == id).price, 0);
  document.getElementById("total").textContent = `₹${total}`;
  document.getElementById("placeOrderBtn").disabled = total === 0;
  document.getElementById("mobileCartText").textContent = `${totalItems} items · ₹${total}`;
}

// ---------- Mobile cart toggle ----------
const cartPanel = document.getElementById("cartPanel");
document.getElementById("mobileCartBar").addEventListener("click", () => cartPanel.classList.toggle("open"));

// ------------Apply Coupon--------------
const couponInput = document.querySelector(".coupon-scrh");
const couponBtn = document.querySelector(".coupon-btn");
const couponMessageEl = document.getElementById("couponMessage");

function handleApplyCoupon() {
  const couponCode = couponInput ? couponInput.value.trim() : "";
  const ids = Object.keys(cart);
  const total = ids.reduce((s, id) => s + cart[id] * MENU.find((m) => m.id == id).price, 0);

  // Require a non-empty code to proceed
  if (!couponCode) {
    if (couponMessageEl) couponMessageEl.textContent = "Please enter a coupon code.";
    return;
  }

  const discountedTotal = applyCoupon(couponCode, total);

  if (discountedTotal !== null) {
    document.getElementById("total").textContent = `₹${discountedTotal.toFixed(2)}`;
    if (couponMessageEl) couponMessageEl.textContent = `Coupon applied! You saved ₹${(total - discountedTotal).toFixed(2)}.`;
    appliedCouponCode = couponCode;
  } else {
    // Invalid: show message, clear input, clear applied state and briefly label the button
    if (couponMessageEl) couponMessageEl.textContent = "Invalid coupon code.🫠";
    appliedCouponCode = null;
    if (couponInput) couponInput.value = "";
    // keep button label unchanged; message element shows invalid text
  }
}

if (couponInput) {
  couponInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleApplyCoupon();
  });
}
if (couponBtn) {
  couponBtn.addEventListener("click", handleApplyCoupon);
}



// ---------- Place order ----------
let pendingOrder = null; // Store order data before showing form

document.getElementById("placeOrderBtn").addEventListener("click", () => {
  const tableInput = document.getElementById("tableNumber");
  const table = tableInput.value.trim();
  const hint = document.getElementById("hint");

  if (!table || Number(table) <= 0) {
    hint.textContent = "Please enter your table number first.";
    tableInput.focus();
    return;
  }
  hint.textContent = "";

  const ids = Object.keys(cart);
  const items = ids.map((id) => {
    const item = MENU.find((m) => m.id == id);
    return { id: item.id, name: item.name, price: item.price, qty: cart[id] };
  });
  const rawTotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  let total = rawTotal;

  // If the user has typed a coupon, validate it now. Block order if invalid.
  const enteredCoupon = couponInput ? couponInput.value.trim() : "";
  if (enteredCoupon) {
    // If entered coupon differs from the previously applied one, validate it.
    if (enteredCoupon !== (appliedCouponCode || "")) {
      const discCheck = applyCoupon(enteredCoupon, rawTotal);
      if (discCheck === null) {
        if (couponMessageEl) couponMessageEl.textContent = "Invalid coupon code.";
        return; // block order placement
      }
      // valid — adopt it
      appliedCouponCode = enteredCoupon;
      total = discCheck;
      if (couponMessageEl) couponMessageEl.textContent = `Coupon applied! You saved ₹${(rawTotal - total).toFixed(2)}.`;
    } else if (appliedCouponCode) {
      const disc = applyCoupon(appliedCouponCode, rawTotal);
      if (disc !== null) total = disc;
    }
  } else if (appliedCouponCode) {
    const disc = applyCoupon(appliedCouponCode, rawTotal);
    if (disc !== null) total = disc;
  }

  // Store the order data and show the customer details form
  pendingOrder = {
    table: table,
    items: items,
    total: total,
    coupon: appliedCouponCode || null,
    subtotal: rawTotal,
  };

  // Clear form and show modal
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("customerEmail").value = "";
  document.getElementById("formOverlay").classList.add("show");
  document.getElementById("customerName").focus();
});

// ---------- Customer Details Form Handling ----------
const formOverlay = document.getElementById("formOverlay");
const customerDetailsForm = document.getElementById("customerDetailsForm");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

// Close form
closeFormBtn.addEventListener("click", () => {
  formOverlay.classList.remove("show");
  pendingOrder = null;
});

cancelFormBtn.addEventListener("click", () => {
  formOverlay.classList.remove("show");
  pendingOrder = null;
});

// Handle form submission
customerDetailsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!pendingOrder) return;

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const email = document.getElementById("customerEmail").value.trim();

  // Validate inputs
  if (!name || !phone || !email) {
    alert("Please fill in all fields.");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Validate phone number (basic: should contain digits)
  if (phone.length < 10 || !/\d{10}/.test(phone.replace(/\D/g, ""))) {
    alert("Please enter a valid contact number.");
    return;
  }

  // Create the complete order with customer details
  const order = {
    id: "ord_" + Date.now(),
    number: nextOrderNumber(),
    table: pendingOrder.table,
    items: pendingOrder.items,
    total: pendingOrder.total,
    coupon: pendingOrder.coupon,
    subtotal: pendingOrder.subtotal,
    status: "pending",
    time: Date.now(),
    customer: {
      name: name,
      phone: phone,
      email: email,
    },
  };

  // Submit the order
  addOrder(order);

  // Show success modal
  document.getElementById("orderId").textContent = "TICKET #" + String(order.number).padStart(3, "0");
  document.getElementById("tableConfirm").textContent = "Table " + pendingOrder.table;
  document.getElementById("overlay").classList.add("show");

  // Close form modal
  formOverlay.classList.remove("show");

  // Clear cart
  Object.keys(cart).forEach((id) => delete cart[id]);
  CATEGORIES.forEach((cat) => MENU.filter((m) => m.cat === cat).forEach((item) => renderItemActions(item.id)));
  renderCart();
  cartPanel.classList.remove("open");

  // Reset coupon state
  appliedCouponCode = null;
  if (couponInput) couponInput.value = "";
  if (couponMessageEl) couponMessageEl.textContent = "";

  // Clear pending order
  pendingOrder = null;
});

// ---------- Success Modal Close ----------
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("show");
});

renderCart();
