const API = "/api/tasks";

const els = {
  list: document.getElementById("task-list"),
  empty: document.getElementById("empty"),
  dialog: document.getElementById("dialog"),
  form: document.getElementById("form"),
  error: document.getElementById("form-error"),
  search: document.getElementById("search"),
  today: document.getElementById("today"),
};

let state = { status: "", q: "" };

// ---------- Helpers ----------
const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

function daysLeft(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00") - today) / 86400000);
}

function dueBadge(task) {
  if (task.done) return { text: "Selesai", cls: "" };
  const d = daysLeft(task.deadline);
  if (d < 0) return { text: `Terlambat ${-d} hari`, cls: "due-late" };
  if (d === 0) return { text: "Hari ini!", cls: "due-late" };
  if (d <= 3) return { text: `${d} hari lagi`, cls: "due-soon" };
  return { text: `${d} hari lagi`, cls: "" };
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(url, options) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Terjadi kesalahan.");
  }
  return res.status === 204 ? null : res.json();
}

// ---------- Render ----------
async function load() {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.q) params.set("q", state.q);
  const tasks = await api(`${API}?${params}`);
  render(tasks);
  updateStats();
}

function render(tasks) {
  els.empty.hidden = tasks.length > 0;
  els.list.innerHTML = tasks.map((t) => {
    const due = dueBadge(t);
    return `
      <li class="task p-${t.priority} ${t.done ? "is-done" : ""}" data-id="${t.id}">
        <input type="checkbox" class="check" ${t.done ? "checked" : ""} aria-label="Tandai selesai" />
        <div class="task-body">
          <h3 class="task-title">${esc(t.title)}</h3>
          ${t.course ? `<p class="task-course">${esc(t.course)}</p>` : ""}
          ${t.description ? `<p class="task-desc">${esc(t.description)}</p>` : ""}
          <div class="badges">
            <span class="badge">📅 ${fmtDate(t.deadline)}</span>
            <span class="badge ${due.cls}">${due.text}</span>
            <span class="badge prio-${t.priority}">Prioritas ${t.priority}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn edit" aria-label="Edit">✎</button>
          <button class="icon-btn del" aria-label="Hapus">🗑</button>
        </div>
      </li>`;
  }).join("");
}

async function updateStats() {
  const all = await api(API);
  const pending = all.filter((t) => !t.done);
  document.getElementById("stat-total").textContent = all.length;
  document.getElementById("stat-pending").textContent = pending.length;
  document.getElementById("stat-soon").textContent = pending.filter((t) => daysLeft(t.deadline) <= 3).length;
  document.getElementById("stat-done").textContent = all.length - pending.length;
}

// ---------- Dialog ----------
function openForm(task) {
  els.error.hidden = true;
  document.getElementById("dialog-title").textContent = task ? "Edit Tugas" : "Tambah Tugas";
  document.getElementById("f-id").value = task?.id ?? "";
  document.getElementById("f-title").value = task?.title ?? "";
  document.getElementById("f-course").value = task?.course ?? "";
  document.getElementById("f-deadline").value = task?.deadline ?? "";
  document.getElementById("f-priority").value = task?.priority ?? "sedang";
  document.getElementById("f-description").value = task?.description ?? "";
  els.dialog.showModal();
}

document.getElementById("btn-add").addEventListener("click", () => openForm());
document.getElementById("btn-cancel").addEventListener("click", () => els.dialog.close());

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("f-id").value;
  const payload = {
    title: document.getElementById("f-title").value,
    course: document.getElementById("f-course").value,
    deadline: document.getElementById("f-deadline").value,
    priority: document.getElementById("f-priority").value,
    description: document.getElementById("f-description").value,
  };
  try {
    await api(id ? `${API}/${id}` : API, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    els.dialog.close();
    load();
  } catch (err) {
    els.error.textContent = err.message;
    els.error.hidden = false;
  }
});

// ---------- List actions (event delegation) ----------
els.list.addEventListener("click", async (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("check")) {
    await api(`${API}/${id}`, { method: "PATCH", body: JSON.stringify({ done: e.target.checked }) });
    load();
  } else if (e.target.closest(".edit")) {
    openForm(await api(`${API}/${id}`));
  } else if (e.target.closest(".del")) {
    if (confirm("Hapus tugas ini?")) {
      await api(`${API}/${id}`, { method: "DELETE" });
      load();
    }
  }
});

// ---------- Filter & search ----------
document.querySelectorAll(".tab").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelector(".tab.active").classList.remove("active");
    btn.classList.add("active");
    state.status = btn.dataset.status;
    load();
  })
);

let timer;
els.search.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => { state.q = els.search.value.trim(); load(); }, 250);
});

// ---------- Init ----------
els.today.textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
load();
