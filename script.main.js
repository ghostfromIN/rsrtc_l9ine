let allCities = [];
let busListArray = [];
let selectedFromId = null;
let selectedToId = null;
let busLimit = 0;
let isFetching = false;
let totalAvailableBuses = 0;

// Obfuscated Base Configuration
// Obfuscated Base Configuration (Base64 Encoded)
// Obfuscated Base Configuration (Multiple parts + Base64)
// Obfuscated Base Configuration (Clean & Safe Split)
const _c = {
  // Base URL (Base64)
  base: atob("aHR0cHM6Ly91c2VyLmJ1c2Rla2hvLmluLw=="), // https://user.busdekho.in/
  
  // Proxy URL split safely (No invalid base64 chars)
  prx: "https://altufalturepo.vercel.app/" + atob("YXBpL3Byb3h5P3VybD0="), // https://altufalturepo.vercel.app/api/proxy?url=

  // API Paths (Base64)
  v: atob("djIv"), // v2/
  s: atob("c2VhcmNoLnBocA=="), // search.php
  c: atob("Y2l0eXMucGhw"), // citys.php
  d: atob("ZGV0YWlsLnBocA=="), // detail.php
  b: atob("Z2V0QnVzQnlJRC5waHA="), // getBusByID.php
};

const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const findBtn = document.getElementById("findBtn");
const loader = document.getElementById("loader");
const resultsSection = document.getElementById("resultsSection");
const busList = document.getElementById("busList");
const miniLoader = document.getElementById("loadMoreLoader");

const buildUrl = (pathKey, useProxy = true) => {
  const baseUrl = _c.base + _c.v + _c[pathKey];
  return useProxy
    ? _c.prx + encodeURIComponent(baseUrl)
    : baseUrl;
};

const convertTo12HourAdvance = (input) => {
  if (!input && input !== 0) return "Invalid Input";

  let hours,
    minutes = 0;

  // 1. Agar input sirf Number hai (e.g., 13) ya String number (e.g., "13")
  if (!isNaN(input) && !input.toString().includes(":")) {
    hours = parseInt(input);
  }
  // 2. Agar input "2:4" ya "02:04" format mein hai
  else if (typeof input === "string" && input.includes(":")) {
    const parts = input.split(":");
    hours = parseInt(parts[0]);
    minutes = parseInt(parts[1]) || 0;
  } else {
    return "Invalid Format";
  }

  // 3. Validation: Check karein ki hours/minutes range mein hain ya nahi
  if (isNaN(hours) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "Invalid Time Range";
  }

  // 4. Conversion Logic
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};

async function secureFetch(url, options = {}) {
  // Extra headers ko hata diya jo CORS preflight fail kar rahe the
  options.headers = {
    ...options.headers,
  };

  // Referer ko minimize karne ke liye
  options.referrerPolicy = "no-referrer";

  return await fetch(url, options);
}

// fullName: `${item.name}, ${item.district} (${item.state})`,

// --- 2. City Loading & Dropdown ---
async function LoadCities() {
  const citiesApi = buildUrl("c", true);
  try {
    const response = await secureFetch(citiesApi);
    const re = await response.json();
    if (re.status === "true") {
      allCities = re.data.map((item) => ({
        id: item.id,
        fullName: `${item.name}`,
        name: item.name,
      }));
    }
  } catch (e) {
    console.error("City Load Fail:", e);
  }
}

function showDropdown(inputEl, dropdownEl, type) {
  const filter = inputEl.value.toLowerCase();
  dropdownEl.innerHTML = "";
  const filtered = allCities.filter((c) =>
    c.fullName.toLowerCase().includes(filter),
  );
  filtered.forEach((city) => {
    const div = document.createElement("div");
    div.className = "p-3 hover:bg-blue-50 cursor-pointer text-sm border-b";
    div.textContent = city.fullName;
    div.onclick = () => {
      inputEl.value = city.name;
      if (type === "from") selectedFromId = city.id;
      else selectedToId = city.id;
      dropdownEl.classList.add("hidden");
    };
    dropdownEl.appendChild(div);
  });
  dropdownEl.classList.toggle(
    "hidden",
    filtered.length === 0 || filter.length === 0,
  );
}

fromInput.oninput = () =>
  showDropdown(fromInput, document.getElementById("fromDropdown"), "from");
toInput.oninput = () =>
  showDropdown(toInput, document.getElementById("toDropdown"), "to");

// --- 3. Bus Search & Infinite Scroll ---
async function performSearch(fromId, toId, isLoadMore = false) {
  if (isFetching) return;
  isFetching = true;
  if (!isLoadMore) {
    busLimit = 0;
    busListArray = [];
    busList.innerHTML = "";
    loader.classList.remove("hidden");
  } else {
    if (miniLoader) miniLoader.classList.remove("hidden");
  }

  const formData = new FormData();
  formData.append("city_from", fromId);
  formData.append("city_to", toId);
  formData.append("limit", busLimit.toString());

  try {
    const res = await (
      await secureFetch(buildUrl("s", true), { method: "POST", body: formData })
    ).json();

    if (res.status === "true" && res.data) {
      totalAvailableBuses = parseInt(res.count) || 0;
      res.data.forEach((bus) => {
        const currentIndex = busListArray.length;
        const k = {
          bus_code: bus.bus_code, // FIXED: Yahan bus_code map ho gaya
          vendor: bus.vendor,
          arrival: bus.endtime,
          departure: bus.starttime,
          seats: bus.seat,
          route: bus.route,
          type: bus.type || "Standard",
          from: bus.city_from,
          to: bus.city_to,
          yatraTime: bus.yatraTime,
        };
        busListArray.push(k);
        busList.insertAdjacentHTML(
          "beforeend",
          createBusCardHTML(k, currentIndex),
        );
      });
      busLimit += res.data.length;

      var shareBtn = document.getElementById("shareResultsBtn");

      if (shareBtn) {
        var data = {
          dataType: 1, // Search List
          fromID: fromId,
          toID: toId,
        };

        const SECRET_KEY = atob("WUhH") + atob("SU5E") + atob("SUFO");

        const token = btoa(SECRET_KEY + "|" + JSON.stringify(data));

        const shareUrl = `${window.location.origin}${window.location.pathname}?d=${encodeURIComponent(token)}`;

        shareBtn.onclick = () => shareBusDetails(shareUrl);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loader.classList.add("hidden");
    if (miniLoader) miniLoader.classList.add("hidden");
    isFetching = false;
  }
}

// --- 4. Card UI ---
function createBusCardHTML(k, index) {
  return `
    <div class="bus-card mx-4 transition-all duration-300 hover:shadow-xl hover:border-blue-200 active:scale-[0.98]">
        <div class="flex justify-between items-start mb-5">
            <div class="flex flex-col">
                <h4 class="text-lg font-bold text-slate-900 mb-0.5">${k.vendor}</h4>
                <span class="w-fit bus-type-tag text-[10px] font-bold tracking-wider">${k.type}</span>
            </div>
            <div class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[11px] font-bold border border-emerald-100">
                ${k.seats} DEPOT
            </div>
        </div>

        <div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl mb-5 border border-slate-100">
            <div class="text-center">
                <p class="text-lg font-black text-slate-800">${convertTo12HourAdvance(k.departure)}</p>
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dep</p>
            </div>
            <div class="flex-1 px-4 flex flex-col items-center">
                <span class="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1.5">${k.yatraTime}</span>
                <div class="w-full h-1 bg-slate-200 rounded-full relative">
                    <div class="absolute left-0 w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                    <div class="absolute right-0 w-2 h-2 bg-slate-400 rounded-full shadow-sm"></div>
                </div>
            </div>
            <div class="text-center">
                <p class="text-lg font-black text-slate-800">${convertTo12HourAdvance(k.arrival)}</p>
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Arr</p>
            </div>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-slate-50">
            <p class="text-[11px] text-slate-500 flex items-center font-medium truncate max-w-[60%]">
                <i data-lucide="map-pinned" class="w-3.5 h-3.5 mr-1.5 text-blue-500"></i> ${k.route}
            </p>
            <button onclick="selectBus(${index}, '${fromInput.value}', '${toInput.value}')" 
                    class="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200">
                View Details
            </button>
        </div>
    </div>`;
}

// --- 5. Event Listeners ---
findBtn.addEventListener("click", () => {
  if (!selectedFromId || !selectedToId) {
    alert("Please select a city first!");
    return;
  }
  showPanel("resultsSection");
  performSearch(selectedFromId, selectedToId);
});

function handleScroll(e) {
  const target =
    e.target === document
      ? document.documentElement || document.body
      : e.target;

  if (resultsSection.classList.contains("active") && !isFetching) {
    const scrollHeight = target.scrollHeight;
    const scrollTop = target.scrollTop || window.pageYOffset;
    const clientHeight = target.clientHeight || window.innerHeight;

    // Debugging: Har scroll par 'g' print hoga
    console.log("Scrolling...");

    if (scrollTop + clientHeight >= scrollHeight - 200) {
      if (busListArray.length < totalAvailableBuses) {
        console.log(
          `%c[LoadMore] Triggered! ${busListArray.length}/${totalAvailableBuses}`,
          "color: #00ff00; font-weight: bold;",
        );
        if (selectedFromId && selectedToId) {
          performSearch(selectedFromId, selectedToId, true);
        }
      }
    }
  }
}

document.getElementById("closeResults").onclick = () => {
  showPanel("mainPanel");
};

async function renderBusDetails(busObj, ogFrom, ogTo) {
  const tbody = document.getElementById("scheduleBody");
  const loader = document.getElementById("loader");

  // 1. Info Header Update (Material 3 Style)
  document.getElementById("detVendor").innerText = busObj.vendor;
  document.getElementById("detRoute").innerText =
    `${busObj.from || "---"} to ${busObj.to || "---"}`;

  // Yahan hum wo fields fill kar rahe hain jo old project mein thin
  document.getElementById("detDuration").innerText = busObj.yatraTime;
  document.getElementById("detDepot").innerText = busObj.seats; // Depot/Seat info
  document.getElementById("detType").innerText = busObj.type;
  tbody.innerHTML =
    '<tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>';
  loader.classList.remove("hidden");

  try {
    const formData = new FormData();
    formData.append("busid", busObj.bus_code);

    var url = buildUrl("d", true);
    const res = await (
      await secureFetch(url, { method: "POST", body: formData })
    ).json();

    if (res.status === "true" && res.data) {
      tbody.innerHTML = "";
      res.data.forEach((st, i) => {
        const isMatch =
          st.station.toLowerCase().includes(ogFrom.toLowerCase()) ||
          st.station.toLowerCase().includes(ogTo.toLowerCase());

        let lineClass = i === res.data.length - 1 ? "hidden" : "block";

        tbody.innerHTML += `
                    <tr class="${isMatch ? "bg-blue-50/80" : ""}">
                        <td class="p-4 w-12 text-center relative">
                            <div class="relative z-10 w-3 h-3 mx-auto rounded-full ${isMatch ? "bg-blue-600" : "bg-slate-300"}"></div>
                            <div class="absolute top-0 left-1/2 w-0.5 h-full bg-slate-200 ${lineClass}"></div>
                        </td>
                        <td class="p-4 font-semibold ${isMatch ? "text-blue-700" : "text-slate-800"}">${st.station}</td>
                        <td class="p-4 text-sm text-slate-500">${convertTo12HourAdvance(st.arrival)}</td>
                        <td class="p-4 text-sm text-slate-500">${convertTo12HourAdvance(st.departure)}</td>
                        <td class="p-4 text-right"><span class="text-xs bg-slate-100 px-2 py-1 rounded">${st.distance} km</span></td>
                    </tr>`;
      });
    }

    const shareBtn = document.querySelector("#detailsPage .share-nav-btn");

    if (shareBtn) {
      const data = {
        dataType: 0, // Bus Details
        busid: busObj.bus_code,
        from: ogFrom,
        to: ogTo,
      };

      const SECRET_KEY = atob("WUhH") + atob("SU5E") + atob("SUFO");

      const token = btoa(SECRET_KEY + "|" + JSON.stringify(data));

      const shareUrl = `${window.location.origin}${window.location.pathname}?d=${encodeURIComponent(token)}`;

      shareBtn.onclick = () => shareBusDetails(shareUrl);
    }
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="p-4 text-center text-red-500">Failed</td></tr>';
  } finally {
    loader.classList.add("hidden");
  }
}
function closeDetailsPage() {
  showPanel("resultsSection");
}

function selectBus(index, fromName, toName) {
  const bus = busListArray[index];
  showPanel("detailsPage");
  renderBusDetails(bus, fromName, toName);
}

// --- Script Init ke waqt isse call kar do ---
document.addEventListener("DOMContentLoaded", async () => {
  HeaderModule.create("app-header");
  await loadFromParams();
  LoadCities();
});

window.addEventListener("load", () => {
  loader.classList.add("hidden");
});
function showPanel(panelId) {
  // 1. Sabhi panels ko hide karo
  document.querySelectorAll(".app-panel").forEach((panel) => {
    panel.classList.add("hidden");
    panel.classList.remove("active");
  });

  // 2. Sirf select kiye hue panel ko dikhao
  const target = document.getElementById(panelId);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }
}

document.getElementById("swapBtn").addEventListener("click", () => {
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
  [selectedFromId, selectedToId] = [selectedToId, selectedFromId];
});

function shareBusDetails(customUrl) {
  const text = `Check it now!`;

  if (navigator.share) {
    navigator
      .share({
        title: `check Bus Infos`,
        text: text,
        url: customUrl,
      })
      .catch((err) => console.log("Sharing failed", err));
  } else {
    // Desktop ke liye WhatsApp fallback
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + "\n" + customUrl)}`;
    window.open(waUrl, "_blank");
  }
}

async function loadFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("d");

  if (!token) return;

  try {
    const SECRET_KEY = atob("WUhH") + atob("SU5E") + atob("SUFO");

    const decoded = atob(token);

    if (!decoded.startsWith(SECRET_KEY + "|")) {
      throw new Error("Invalid token");
    }

    const json = decoded.slice(SECRET_KEY.length + 1);
    const data = JSON.parse(json);

    loader.classList.remove("hidden");

    switch (data.dataType) {
      // Bus Details
      case 0: {
        const busId = data.busid;
        const ogFrom = data.from || "";
        const ogTo = data.to || "";

        const formData = new FormData();
        formData.append("busid", busId);

        const url = buildUrl("b", true);

        const response = await secureFetch(url, {
          method: "POST",
          body: formData,
        });

        const resJson = await response.json();

        if (resJson.status === "true" && resJson.data) {
          await renderBusDetails(resJson.data, ogFrom, ogTo);

          showPanel("detailsPage");
        }

        break;
      }

      // Search Results
      case 1: {
        loader.classList.remove("hidden");

        await new Promise((resolve) => setTimeout(resolve, 100));

        await performSearch(data.fromID, data.toID);

        showPanel("resultsSection");
        break;
      }

      default:
        throw new Error(`Unknown share type: ${data.dataType}`);
    }
  } catch (error) {
    console.error("Error loading shared link:", error);

    const token = new URLSearchParams(location.search).get("d");

    console.log("Token:", token);

    if (token) {
      try {
        console.log("Decoded:", atob(token));
      } catch (e) {
        console.error("ATOB Failed:", e);
      }
    }
  } finally {
    loader.classList.add("hidden");
  }
}

window.addEventListener("scroll", handleScroll, true);
resultsSection.addEventListener("scroll", handleScroll);

const depotData = [
  { name: "Abu Road", no: "02974 - 222323" },
  { name: "Ahmedabad", no: "7228883966, 7228883992" },
  { name: "Ajaymeru(Ajmer)", no: "0145 - 2429398" },
  { name: "Ajmer", no: "0145 - 2429398" },
  { name: "Alwar", no: "0144 - 2334984" },
  { name: "Anoopgarh", no: "01498 - 252173" },
  { name: "Banswara", no: "02962 - 242825" },
  { name: "Baran", no: "07453 - 230220" },
  { name: "Barmer", no: "02982 - 220199" },
  { name: "Beawar", no: "01462 - 257560" },
  { name: "Bharatpur", no: "05644 - 260330, 8306399989" },
  { name: "Bhilwara", no: "01482 - 220111" },
  { name: "Bikaner", no: "0151 - 2523800" },
  { name: "Bundi", no: "0747 - 2445422" },
  { name: "Chittorgarh", no: "01472 - 241177" },
  { name: "Churu", no: "01562 - 250904" },
  { name: "Dausa", no: "01427 - 223764" },
  { name: "Deedwana", no: "01580 - 220018" },
  { name: "Delhi", no: "011 - 23864470" },
  { name: "Deluxe", no: "0141 - 2204445" },
  { name: "Dhaulpur", no: "05642 - 240859" },
  { name: "Dungarpur", no: "02964 - 232260" },
  { name: "Falna", no: "02938 - 236124" },
  { name: "Ganganagar", no: "0154 - 2472220" },
  { name: "Hanumangarh", no: "01552 - 269075" },
  { name: "Hindaun City", no: "07469 - 232171" },
  { name: "Indore", no: "0731 - 2447215" },
  { name: "Jaipur (Sindhi Camp)", no: "0141 - 2207906" },
  { name: "Jaisalmer", no: "02992 - 251541" },
  { name: "Jalore", no: "02973 - 222589" },
  { name: "Jhalawar", no: "07432 - 232386" },
  { name: "Jhunjhunu", no: "01592 - 232664" },
  { name: "Jodhpur", no: "0291 - 2544686" },
  { name: "Jodhpur CBS (Volvo)", no: "0291 - 2544686, 2553582" },
  { name: "Karoli", no: "07464 - 221041" },
  { name: "Khetri", no: "01593 - 234450" },
  { name: "Kota", no: "0744 - 2451020" },
  { name: "Kotputli", no: "01421 - 222069" },
  { name: "Lohagarh", no: "05644 - 260330" },
  { name: "Matasya Nagar", no: "0144 - 2338285" },
  { name: "Nagaur", no: "01582 - 240863" },
  { name: "Pali", no: "02932 - 357296" },
  { name: "Phalodi", no: "02925 - 223562" },
  { name: "Rajsamand", no: "02952 - 222411" },
  { name: "Revdar", no: "02975 - 222411" },
  { name: "Sardar Shahar", no: "01564 - 220119" },
  { name: "Sawai Madhopur", no: "07462 - 252006" },
  { name: "Sikar", no: "01572 - 270339" },
  { name: "Sirohi", no: "02972 - 222511" },
  { name: "Sri Madhopur", no: "01575 - 252006" },
  { name: "Tijara", no: "01469 - 262045" },
  { name: "Tonk", no: "01432 - 247497" },
  { name: "Udaipur", no: "0294 - 2484191" },
  { name: "Vaishali Nagar(Sindhi Camp)", no: "0141-2207906" },
  { name: "Vidhyadhar Nagar(Sindhi Camp)", no: "0141-2207906" },
];

function renderDepots(filter = "") {
  const list = document.getElementById("depotList");
  list.innerHTML = "";
  const filtered = depotData.filter((d) =>
    d.name.toLowerCase().includes(filter.toLowerCase()),
  );

  filtered.forEach((d) => {
    const card = document.createElement("div");
    card.className =
      "p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center";

    const isAvailable = d.no !== "NOT AVAILABLE";
    const btnHtml = isAvailable
      ? `
    <div class="flex gap-1">
        <button onclick="shareDepot('${d.name}', '${d.no}')" class="p-3 text-slate-400 hover:bg-slate-100 rounded-xl transition">
            <i data-lucide="share-2" class="w-5 h-5"></i>
        </button>
        <button onclick="openDialMenu('${d.name}', '${d.no}')" 
            class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-200">
            <i data-lucide="phone" class="w-5 h-5"></i>
        </button>
    </div>`
      : `<span class="text-slate-400 text-xs italic bg-slate-100 px-3 py-1 rounded-full">N/A</span>`;

    card.innerHTML = `
            <div>
                <h3 class="font-bold text-slate-800">${d.name}</h3>
                <p class="text-blue-600 font-semibold text-xs mt-1">${d.no}</p>
            </div>
            ${btnHtml}
        `;
    list.appendChild(card);
  });
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// Share Function
function shareDepot(name, number) {
  if (navigator.share) {
    navigator
      .share({
        title: "RSRTC Depot Enquiry",
        text: `डिपो: ${name}, संपर्क नंबर: ${number}`,
        url: window.location.href,
      })
      .catch(console.error);
  } else {
    alert("आपका ब्राउज़र शेयरिंग सपोर्ट नहीं करता।");
  }
}

function openDialMenu(name, numbers) {
  const numList = numbers.split(",").map((n) => n.trim());
  const container = document.getElementById("numberOptions");
  container.innerHTML = "";

  numList.forEach((num) => {
    const btn = document.createElement("a");
    btn.href = `tel:${num}`;
    btn.className =
      "block w-full text-center py-4 bg-blue-50 text-blue-700 font-bold rounded-2xl hover:bg-blue-100 active:bg-blue-200 transition";
    btn.innerText = num;
    container.appendChild(btn);
  });
  document.getElementById("dialModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("dialModal").classList.add("hidden");
}

document
  .getElementById("depotSearch")
  .addEventListener("input", (e) => renderDepots(e.target.value));

// Init
renderDepots();
