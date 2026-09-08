/* ============================================================
   kitchen.js — restaurant computer / kitchen dashboard
   Relies on getOrders, updateOrderStatus, removeOrder from shared.js
   ============================================================ */

function elapsedLabel(time) {
  const mins = Math.floor((Date.now() - time) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

function ticketCard(order) {
  const itemsHtml = order.items
    .map((it) => `<li><span><span class="qty">${it.qty}×</span>${it.name}</span><span>₹${it.price * it.qty}</span></li>`)
    .join("");

  let actionHtml = "";
  if (order.status === "pending") {
    actionHtml = `<button class="action to-preparing" onclick="advance('${order.id}','preparing')">Start Preparing</button>`;
  } else if (order.status === "preparing") {
    actionHtml = `<button class="action to-served" onclick="advance('${order.id}','served')">Mark Served</button>`;
  } else {
    actionHtml = `<button class="action to-clear" onclick="clearTicket('${order.id}')">Clear Ticket</button>`;
  }

  return `
    <div class="ticket" data-status="${order.status}">
      <div class="row1">
        <span class="ticket-num">TICKET #${String(order.number).padStart(3, "0")}</span>
        
        <span class="table-tag">TABLE ${order.table}</span>
      </div>
      <div class="elapsed">${elapsedLabel(order.time)}</div>
      <ul>${itemsHtml}</ul>
      <div class="total-row"><span>Total</span><span>₹${order.total}</span></div>
      ${actionHtml}
    </div>
  `;
}

function render() {
  const orders = getOrders().sort((a, b) => a.time - b.time);
  ["pending", "preparing", "served"].forEach((status) => {
    const list = orders.filter((o) => o.status === status);
    document.getElementById("count-" + status).textContent = list.length;
    const container = document.getElementById("cards-" + status);
    container.innerHTML = list.length
      ? list.map(ticketCard).join("")
      : `<div class="empty-col">No tickets here.</div>`;
  });
}

function advance(id, newStatus) {
  updateOrderStatus(id, newStatus);
  render();
}

function clearTicket(id) {
  removeOrder(id);
  render();
}

// ---------- Live sync ----------
// Fires when another tab (the customer screen) changes localStorage.
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) render();
});



// Fallback poll, in case storage events are unreliable in some setups.
setInterval(render, 3000);

// ---------- Clock ----------
function tickClock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit" ,
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
setInterval(tickClock, 1000);
tickClock();

render();
