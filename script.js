const startHour = 8;
const endHour = 16;
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const totalWeeks = 52;
const calendar = document.getElementById("calendar");
const modal = document.getElementById("modal");
const modalTime = document.getElementById("modal-time");
const form = document.getElementById("booking-form");
const weekNav = document.getElementById("week-nav");
const deleteBtn = document.getElementById("delete-btn");

let selectedSlot = null;
let bookings = {};

// Load bookings from backend
async function loadBookings() {
  try {
    const res = await fetch('http://192.168.0.23:3001/bookings');
    const data = await res.json();
    bookings = {};
    data.forEach(b => bookings[b.id] = b);
    renderCalendar();
  } catch (err) {
    console.error("Failed to load bookings:", err);
  }
}

// Save a booking to backend
async function saveBooking(slot, bookingData) {
  try {
    await fetch('http://192.168.0.23:3001/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: slot, ...bookingData })
    });
  } catch (err) {
    console.error("Failed to save booking:", err);
  }
}

// Delete a booking from backend
async function deleteBooking(slot) {
  try {
    await fetch(`http://192.168.0.23:3001/bookings/${slot}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error("Failed to delete booking:", err);
  }
}

// Format time display
function formatTime(time) {
  const hour = Math.floor(time);
  const minutes = time % 1 === 0 ? "00" : "30";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${suffix}`;
}

// Get current week number
function getCurrentWeekNumber() {
  const currentDate = new Date();
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// Calculate date range for a week
function getWeekDateRange(weekNumber, year) {
  const jan4 = new Date(year, 0, 4);
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

// Render calendar grid
function renderCalendar(visibleWeek = getCurrentWeekNumber()) {
  calendar.innerHTML = '';
  weekNav.innerHTML = '';

  for (let week = 1; week <= totalWeeks; week++) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = "#";
    link.textContent = `Week ${week}`;
    if (week === visibleWeek) {
      link.style.fontWeight = 'bold';
      link.style.color = '#1d4ed8';
    }
    link.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".week-section").forEach(section => {
        section.style.display = "none";
      });
      document.getElementById(`week-${week}`).style.display = "block";
    });
    li.appendChild(link);
    weekNav.appendChild(li);

    const section = document.createElement('div');
    section.className = 'week-section';
    section.id = `week-${week}`;
    section.style.display = week === visibleWeek ? 'block' : 'none';

    const header = document.createElement('div');
    header.className = 'week-header';
    const dateRange = getWeekDateRange(week, 2025);
    header.textContent = `Week ${week} (${dateRange})`;
    section.appendChild(header);

    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-table';
    headerRow.appendChild(document.createElement('div'));
    days.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'header';
      cell.textContent = day;
      headerRow.appendChild(cell);
    });
    section.appendChild(headerRow);

    for (let time = startHour; time < endHour; time += 0.5) {
      const row = document.createElement('div');
      row.className = 'calendar-table';

      const timeCell = document.createElement('div');
      timeCell.className = 'time-label';
      timeCell.textContent = `${formatTime(time)} - ${formatTime(time + 0.5)}`;
      row.appendChild(timeCell);

      days.forEach(day => {
        const key = `Week${week}-${day}-${time}`;
        const cell = document.createElement('div');
        cell.className = 'slot';

        if (bookings[key]) {
          const booking = bookings[key];
          const status = booking.status || "Booked In";
          const company = booking.company;
          const pos = booking.pos;
          const handball = booking.handball;

          cell.classList.add(status.replace(/\s+/g, '-').toLowerCase());

          cell.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; height: 100%; width: 100%;">
              <div style="text-align: left;">
                <strong>${company}</strong><br>
                POS: ${pos}
              </div>
              ${handball === 'Yes' ? `<img src="hand.png" alt="Hand" style="width: 3rem; height: 3rem;">` : ''}
            </div>
          `;
        }

        cell.addEventListener('click', () => openModal(week, day, time));
        row.appendChild(cell);
      });

      section.appendChild(row);
    }

    calendar.appendChild(section);
  }
}

// Open booking modal
function openModal(week, day, hour) {
  selectedSlot = `Week${week}-${day}-${hour}`;
  modalTime.textContent = `Week ${week}, ${day}, ${formatTime(hour)} - ${formatTime(hour + 0.5)}`;
  modal.style.display = "flex";

  const existing = bookings[selectedSlot];
  if (existing) {
    document.getElementById("supplier").value = existing.company;
    document.getElementById("pos").value = existing.pos;
    document.getElementById("collection").value = existing.collection;
    document.getElementById("notes").value = existing.notes;
    document.getElementById("status").value = existing.status || "Booked In";

    if (existing.handball) {
      document.querySelectorAll('input[name="handball"]').forEach(el => {
        el.checked = el.value === existing.handball;
      });
    }
  } else {
    clearBookingForm();
  }
}

// Close modal
function closeModal() {
  modal.style.display = "none";
  form.reset();
  selectedSlot = null;
  document.querySelectorAll('input[name="handball"]').forEach(el => el.checked = false);
}

// Clear booking form
function clearBookingForm() {
  form.reset();
  document.querySelectorAll('input[name="handball"]').forEach(el => el.checked = false);
}

// Submit booking form
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!selectedSlot) {
    alert("No slot selected.");
    return;
  }

  const bookingData = {
    company: document.getElementById("supplier").value,
    pos: document.getElementById("pos").value,
    collection: document.getElementById("collection").value,
    notes: document.getElementById("notes").value,
    status: document.getElementById("status").value || "Booked In",
    handball: document.querySelector('input[name="handball"]:checked')?.value,
  };

  bookings[selectedSlot] = bookingData;
  saveBooking(selectedSlot, bookingData).then(() => {
    closeModal();
    renderCalendar();
  });
});

// Delete booking
deleteBtn.addEventListener('click', () => {
  if (selectedSlot && bookings[selectedSlot]) {
    if (confirm("Are you sure you want to delete this booking?")) {
      delete bookings[selectedSlot];
      deleteBooking(selectedSlot).then(() => {
        closeModal();
        renderCalendar();
      });
    }
  }
});

// Load bookings on page load
document.addEventListener('DOMContentLoaded', loadBookings);
