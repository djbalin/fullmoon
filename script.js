const TIME_ZONE = "Europe/Copenhagen";
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNODIC_MONTH = 29.530588861;
// Difference between Terrestrial Time and UTC (ΔT), roughly 69 s in the 2020s
const DELTA_T_MS = 69 * 1000;

const PHASE_EMOJIS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
const PHASE_NAMES = [
  "Nymåne",
  "Tiltagende månesigel",
  "Første kvarter",
  "Tiltagende måne",
  "Fuldmåne",
  "Aftagende måne",
  "Sidste kvarter",
  "Aftagende månesigel",
];

const sinDeg = (deg) => Math.sin((deg * Math.PI) / 180);

// Exact moment of full moon number n (counted from January 2000), using
// Jean Meeus, "Astronomical Algorithms", chapter 49. Accurate to about a minute.
function getFullMoon(n) {
  const k = n + 0.5;
  const T = k / 1236.85;

  const jde =
    2451550.09766 +
    SYNODIC_MONTH * k +
    0.00015437 * T ** 2 -
    0.00000015 * T ** 3 +
    0.00000000073 * T ** 4;

  const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3;
  const Mp =
    201.5643 +
    385.81693528 * k +
    0.0107582 * T ** 2 +
    0.00001238 * T ** 3 -
    0.000000058 * T ** 4;
  const F =
    160.7108 +
    390.67050284 * k -
    0.0016118 * T ** 2 -
    0.00000227 * T ** 3 +
    0.000000011 * T ** 4;
  const omega =
    124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3;

  const correction =
    -0.40614 * sinDeg(Mp) +
    0.17302 * E * sinDeg(M) +
    0.01614 * sinDeg(2 * Mp) +
    0.01043 * sinDeg(2 * F) +
    0.00734 * E * sinDeg(Mp - M) -
    0.00514 * E * sinDeg(Mp + M) +
    0.00209 * E * E * sinDeg(2 * M) -
    0.00111 * sinDeg(Mp - 2 * F) -
    0.00057 * sinDeg(Mp + 2 * F) +
    0.00056 * E * sinDeg(2 * Mp + M) -
    0.00042 * sinDeg(3 * Mp) +
    0.00042 * E * sinDeg(M + 2 * F) +
    0.00038 * E * sinDeg(M - 2 * F) -
    0.00024 * E * sinDeg(2 * Mp - M) -
    0.00017 * sinDeg(omega) -
    0.00007 * sinDeg(Mp + 2 * M) +
    0.00004 * sinDeg(2 * Mp - 2 * F) +
    0.00004 * sinDeg(3 * M) +
    0.00003 * sinDeg(Mp + M - 2 * F) +
    0.00003 * sinDeg(2 * Mp + 2 * F) -
    0.00003 * sinDeg(Mp + M + 2 * F) +
    0.00003 * sinDeg(Mp - M + 2 * F) -
    0.00002 * sinDeg(Mp - M - 2 * F) -
    0.00002 * sinDeg(3 * Mp + M) +
    0.00002 * sinDeg(4 * Mp);

  // Perturbations by the planets
  const planetary =
    0.000325 * sinDeg(299.77 + 0.107408 * k - 0.009173 * T ** 2) +
    0.000165 * sinDeg(251.88 + 0.016321 * k) +
    0.000164 * sinDeg(251.83 + 26.651886 * k) +
    0.000126 * sinDeg(349.42 + 36.412478 * k) +
    0.00011 * sinDeg(84.66 + 18.206239 * k) +
    0.000062 * sinDeg(141.74 + 53.303771 * k) +
    0.00006 * sinDeg(207.14 + 2.453732 * k) +
    0.000056 * sinDeg(154.84 + 7.30686 * k) +
    0.000047 * sinDeg(34.52 + 27.261239 * k) +
    0.000042 * sinDeg(207.19 + 0.121824 * k) +
    0.00004 * sinDeg(291.34 + 1.844379 * k) +
    0.000037 * sinDeg(161.72 + 24.198154 * k) +
    0.000035 * sinDeg(239.56 + 25.513099 * k) +
    0.000023 * sinDeg(331.55 + 3.592518 * k);

  const julianDay = jde + correction + planetary;
  return new Date((julianDay - 2440587.5) * DAY_MS - DELTA_T_MS);
}

// The full moons from about two months before to one month after the date
function getFullMoonsAround(date) {
  const n = getFullMoonNumber(date);
  return [n - 2, n - 1, n, n + 1, n + 2].map(getFullMoon);
}

// The next `count` full moons after the date
function getUpcomingFullMoons(date, count) {
  const n = getFullMoonNumber(date) - 1;
  return Array.from({ length: count + 2 }, (_, i) => getFullMoon(n + i))
    .filter((fullMoon) => fullMoon > date)
    .slice(0, count);
}

function getFullMoonNumber(date) {
  const julianDay = date.getTime() / DAY_MS + 2440587.5;
  return Math.floor((julianDay - 2451550.09766) / SYNODIC_MONTH);
}

// 0 and 1 are new moon, 0.5 is full moon
function getMoonPhase(date, fullMoons) {
  const nextIndex = fullMoons.findIndex((fullMoon) => fullMoon > date);
  const previous = fullMoons[nextIndex - 1];
  const next = fullMoons[nextIndex];
  return (0.5 + (date - previous) / (next - previous)) % 1;
}

function getPhaseIndex(phase, isFullMoon) {
  if (isFullMoon) return 4;
  const index = Math.floor(phase * 8 + 0.5) % 8;
  // Only call it full moon on the night the full moon actually happens
  if (index === 4) return phase < 0.5 ? 3 : 5;
  return index;
}

function getCopenhagenParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

// 12:00 Copenhagen time on the given calendar day (day may overflow the month)
function getCopenhagenNoon(year, month, day) {
  const noonUtc = Date.UTC(year, month - 1, day, 12);
  const local = getCopenhagenParts(new Date(noonUtc));
  const offset =
    Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) -
    noonUtc;
  return new Date(noonUtc - offset);
}

// "Tonight" runs from noon to noon, Copenhagen time
function getNight(date) {
  const { year, month, day } = getCopenhagenParts(date);
  const todayNoon = getCopenhagenNoon(year, month, day);
  if (date < todayNoon) {
    return { start: getCopenhagenNoon(year, month, day - 1), end: todayNoon };
  }
  return { start: todayNoon, end: getCopenhagenNoon(year, month, day + 1) };
}

function getCalendarDaysBetween(earlier, later) {
  const a = getCopenhagenParts(earlier);
  const b = getCopenhagenParts(later);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) /
      DAY_MS,
  );
}

function formatFullMoonTime(date) {
  return date.toLocaleString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

function formatFullMoonDate(date) {
  return date.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
}

function formatClock(date) {
  return date.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

function renderFullMoonCalendar(now) {
  document.getElementById("fullMoonList").innerHTML = getUpcomingFullMoons(now, 12)
    .map(
      (fullMoon) => `
        <li>
          <time datetime="${fullMoon.toISOString()}">${formatFullMoonDate(fullMoon)}</time>
          <span class="full-moon-time">kl. ${formatClock(fullMoon)}</span>
        </li>
      `,
    )
    .join("");
}

function renderFaqAnswers(now, fullMoons, nextFullMoon) {
  // "I nat" in the past tense is the night that ended at noon today
  const { year, month, day } = getCopenhagenParts(now);
  const lastNight = getNight(new Date(getCopenhagenNoon(year, month, day) - 1));
  const fullMoonLastNight = fullMoons.find(
    (fullMoon) => fullMoon >= lastNight.start && fullMoon < lastNight.end,
  );
  const previousFullMoon = fullMoons.filter((fullMoon) => fullMoon < now).pop();

  document.getElementById("lastNightAnswer").textContent = fullMoonLastNight
    ? `Ja, det var fuldmåne i nat. Fuldmånen indtraf ${formatFullMoonTime(fullMoonLastNight)}.`
    : `Nej, det var ikke fuldmåne i nat. Næste fuldmåne er ${formatFullMoonTime(nextFullMoon)}.`;

  document.getElementById("previousFullMoonAnswer").textContent =
    `Den seneste fuldmåne var ${formatFullMoonDate(previousFullMoon)} kl. ${formatClock(previousFullMoon)}.`;
}

function startCountdown(targetDate, reloadDate) {
  function updateCountdown() {
    const now = new Date();

    // Reload once the night of the next full moon begins
    if (now >= reloadDate) {
      location.reload();
      return;
    }

    const timeRemaining = targetDate - now;

    const days = Math.floor(timeRemaining / DAY_MS);
    const hours = Math.floor((timeRemaining % DAY_MS) / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
    );

    let countdownText = "";

    if (days > 0) {
      countdownText = `${days}d ${hours}t ${minutes}m`;
    } else if (hours > 0) {
      countdownText = `${hours}t ${minutes}m`;
    } else {
      countdownText = `${minutes}m`;
    }

    document.getElementById("details").innerHTML = `
      <div class="countdown-timer">${countdownText}</div>
      <div class="countdown-label">til næste fuldmåne</div>
    `;
  }

  // Update immediately
  updateCountdown();

  // Update every second
  setInterval(updateCountdown, 1000);
}

// Main execution
function initMoonTracker() {
  const now = new Date();
  const fullMoons = getFullMoonsAround(now);
  const night = getNight(now);

  const fullMoonTonight = fullMoons.find(
    (fullMoon) => fullMoon >= night.start && fullMoon < night.end,
  );
  const nextFullMoon = fullMoons.find((fullMoon) => fullMoon > now);
  const lastFullMoon = fullMoons.filter((fullMoon) => fullMoon < night.start).pop();

  const isFullMoon = fullMoonTonight !== undefined;
  const phaseIndex = getPhaseIndex(getMoonPhase(now, fullMoons), isFullMoon);

  // Update the page
  document.getElementById("moonEmoji").textContent = PHASE_EMOJIS[phaseIndex];
  document.getElementById("phaseInfo").textContent = PHASE_NAMES[phaseIndex];

  if (isFullMoon) {
    document.getElementById("answer").textContent = "JA! 🎉";
    document.getElementById("answer").className = "answer yes";
    document.getElementById("nextFullMoon").textContent = `Fuldmåne: ${formatFullMoonTime(fullMoonTonight)}`;
    document.getElementById("details").innerHTML = "Det er fuldmåne i nat!";

    // Reload when the night is over
    setTimeout(() => location.reload(), night.end - now);
  } else {
    document.getElementById("answer").textContent = "NEJ";
    document.getElementById("answer").className = "answer no";
    document.getElementById("nextFullMoon").textContent = `Næste fuldmåne: ${formatFullMoonTime(nextFullMoon)}`;
    startCountdown(nextFullMoon, getNight(nextFullMoon).start);
  }

  // Display last full moon
  const daysSinceFullMoon = getCalendarDaysBetween(lastFullMoon, now);
  const lastFullMoonString = lastFullMoon.toLocaleDateString("da-DK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIME_ZONE,
  });

  if (daysSinceFullMoon === 0) {
    document.getElementById("lastFullMoon").textContent =
      "Sidste fuldmåne: I dag!";
  } else if (daysSinceFullMoon === 1) {
    document.getElementById(
      "lastFullMoon",
    ).textContent = `Sidste fuldmåne: I går (${lastFullMoonString})`;
  } else {
    document.getElementById(
      "lastFullMoon",
    ).textContent = `Sidste fuldmåne: ${lastFullMoonString} (${daysSinceFullMoon} dage siden)`;
  }

  renderFullMoonCalendar(now);
  renderFaqAnswers(now, fullMoons, nextFullMoon);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMoonTracker);
} else {
  initMoonTracker();
}
