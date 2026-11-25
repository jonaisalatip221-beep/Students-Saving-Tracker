(() => {
  const KEY = "studentSavingsTracker.v1";
  const $ = id => document.getElementById(id);
  let state = { currency: "$", goal: { name: "", target: 0 }, tx: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.tx)) state = saved;
  } catch (e) { /* start fresh */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const money = n => state.currency + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = () => new Date().toISOString().slice(0, 10);

  function render() {
    const inSum = state.tx.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const outSum = state.tx.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    const balance = inSum - outSum;
    const ym = today().slice(0, 7);
    const month = state.tx.filter(t => t.date.startsWith(ym))
      .reduce((s, t) => s + (t.type === "in" ? t.amount : -t.amount), 0);
    const target = state.goal.target;
    const pct = target > 0 ? Math.max(0, Math.min(100, balance / target * 100)) : 0;

    $("currency").value = state.currency;
    $("balance").textContent = money(balance);
    $("inTotal").textContent = money(inSum);
    $("outTotal").textContent = money(outSum);
    $("monthNet").textContent = money(month);
    $("leftTotal").textContent = target > 0 ? money(Math.max(0, target - balance)) : "—";
    $("goalName").textContent = state.goal.name || "No goal yet";
    $("progressText").textContent = target > 0
      ? (balance >= target ? "Goal reached. Nice work!" : Math.round(pct) + "% of " + money(target))
      : "Set a goal to see your progress.";
    $("fill").style.height = pct + "%";
    $("barFill").style.width = pct + "%";
    $("bar").setAttribute("aria-valuenow", Math.round(pct));

    const f = $("filter").value;
    const rows = state.tx.filter(t => f === "all" || t.type === f)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const list = $("list");
    list.replaceChildren();
    rows.forEach(t => {
      const li = document.createElement("li");
      li.className = t.type;
      const dot = Object.assign(document.createElement("span"), { className: "dot" });
      const meta = document.createElement("div");
      meta.className = "meta";
      const title = document.createElement("div");
      title.textContent = t.note || t.category;
      const sub = document.createElement("small");
      sub.textContent = t.category + " · " + t.date;
      meta.append(title, sub);
      const amt = document.createElement("span");
      amt.className = "amt";
      amt.textContent = (t.type === "in" ? "+" : "−") + money(t.amount);
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "×";
      del.setAttribute("aria-label", "Delete transaction");
      del.onclick = () => { state.tx = state.tx.filter(x => x.id !== t.id); save(); render(); };
      li.append(dot, meta, amt, del);
      list.append(li);
    });
    $("empty").style.display = rows.length ? "none" : "block";
  }

  $("currency").onchange = e => { state.currency = e.target.value; save(); render(); };
  $("filter").onchange = render;

  $("goalForm").onsubmit = e => {
    e.preventDefault();
    state.goal = { name: $("goalInput").value.trim(), target: parseFloat($("targetInput").value) };
    e.target.reset(); save(); render();
  };

  $("txForm").onsubmit = e => {
    e.preventDefault();
    const amount = parseFloat($("amount").value);
    const type = document.querySelector("input[name=type]:checked").value;
    const balance = state.tx.reduce((s, t) => s + (t.type === "in" ? t.amount : -t.amount), 0);
    if (!(amount > 0)) { $("msg").textContent = "Enter an amount greater than zero."; return; }
    if (type === "out" && amount > balance) {
      $("msg").textContent = "You only have " + money(balance) + " saved. Enter a smaller amount.";
      return;
    }
    $("msg").textContent = "";
    state.tx.push({ id: Date.now(), type, amount, category: $("category").value, date: $("date").value, note: $("note").value.trim() });
    $("amount").value = ""; $("note").value = "";
    save(); render();
  };

  $("reset").onclick = () => {
    if (confirm("Delete all transactions and your goal? This cannot be undone.")) {
      state = { currency: state.currency, goal: { name: "", target: 0 }, tx: [] };
      save(); render();
    }
  };

  $("date").value = today();
  render();
})();
