// Calculate moon phase based on date
function getMoonPhase(date) {
  // Convert date to UTC
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Calculate Julian Date
  let jd =
    367 * year -
    Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) +
    day +
    1721013.5;

  // Days since known new moon (January 6, 2000)
  const daysSinceNew = jd - 2451549.5;

  // Lunar month is approximately 29.53059 days
  const lunarMonth = 29.53059;

  // Calculate phase (0-1, where 0 and 1 are new moon, 0.5 is full moon)
  const phase = (daysSinceNew / lunarMonth) % 1;

  return phase;
}

function getMoonEmoji(phase) {
  if (phase < 0.0625) return "🌑"; // New Moon
  if (phase < 0.1875) return "🌒"; // Waxing Crescent
  if (phase < 0.3125) return "🌓"; // First Quarter
  if (phase < 0.4375) return "🌔"; // Waxing Gibbous
  if (phase < 0.5625) return "🌕"; // Full Moon
  if (phase < 0.6875) return "🌖"; // Waning Gibbous
  if (phase < 0.8125) return "🌗"; // Last Quarter
  if (phase < 0.9375) return "🌘"; // Waning Crescent
  return "🌑"; // New Moon
}

function getPhaseName(phase) {
  if (phase < 0.0625) return "Nymåne";
  if (phase < 0.1875) return "Tiltagende månesigel";
  if (phase < 0.3125) return "Første kvarter";
  if (phase < 0.4375) return "Tiltagende måne";
  if (phase < 0.5625) return "Fuldmåne";
  if (phase < 0.6875) return "Aftagende måne";
  if (phase < 0.8125) return "Sidste kvarter";
  if (phase < 0.9375) return "Aftagende månesigel";
  return "Nymåne";
}

function getNextFullMoon(currentDate, currentPhase) {
  const lunarMonth = 29.53059;
  let daysUntilFull;

  if (currentPhase < 0.5) {
    // Moon is waxing, full moon is ahead
    daysUntilFull = (0.5 - currentPhase) * lunarMonth;
  } else {
    // Moon is waning, next full moon is in next cycle
    daysUntilFull = (1.5 - currentPhase) * lunarMonth;
  }

  return Math.round(daysUntilFull);
}

function getLastFullMoon(currentDate, currentPhase) {
  const lunarMonth = 29.53059;
  let daysSinceFull;

  if (currentPhase < 0.5) {
    // Moon is waxing, last full moon was in previous cycle
    daysSinceFull = (0.5 + currentPhase) * lunarMonth;
  } else {
    // Moon is waning, full moon was earlier this cycle
    daysSinceFull = (currentPhase - 0.5) * lunarMonth;
  }

  const lastFullMoonDate = new Date(currentDate);
  lastFullMoonDate.setDate(
    lastFullMoonDate.getDate() - Math.round(daysSinceFull),
  );

  return lastFullMoonDate;
}

// Main execution
function initMoonTracker() {
  // Get current date in Denmark timezone
  const now = new Date();
  const denmarkTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Copenhagen" }),
  );

  // Calculate moon phase
  const phase = getMoonPhase(denmarkTime);
  const moonEmoji = getMoonEmoji(phase);
  const phaseName = getPhaseName(phase);

  // Check if it's a full moon (within ±1.5 days of full moon = phase 0.45 to 0.55)
  const isFullMoon = phase >= 0.45 && phase <= 0.55;

  // Update the page
  document.getElementById("moonEmoji").textContent = moonEmoji;

  if (isFullMoon) {
    document.getElementById("answer").textContent = "JA! 🎉";
    document.getElementById("answer").className = "answer yes";
    document.getElementById("details").textContent = "Det er fuldmåne i nat!";
  } else {
    document.getElementById("answer").textContent = "NEJ";
    document.getElementById("answer").className = "answer no";
    const daysUntil = getNextFullMoon(denmarkTime, phase);
    if (daysUntil === 0) {
      document.getElementById("details").textContent =
        "Næste fuldmåne er i morgen!";
    } else if (daysUntil === 1) {
      document.getElementById("details").textContent =
        "Næste fuldmåne er om 1 dag.";
    } else {
      document.getElementById(
        "details",
      ).textContent = `Næste fuldmåne er om cirka ${daysUntil} dage`;
    }
  }

  document.getElementById("phaseInfo").textContent = phaseName;

  // Calculate and display last full moon
  const lastFullMoonDate = getLastFullMoon(denmarkTime, phase);
  const daysSinceFullMoon = Math.round(
    (denmarkTime - lastFullMoonDate) / (1000 * 60 * 60 * 24),
  );

  const lastFullMoonOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Copenhagen",
  };
  const lastFullMoonString = lastFullMoonDate.toLocaleDateString(
    "da-DK",
    lastFullMoonOptions,
  );

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

  // Format date in Danish
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Copenhagen",
  };
  const dateString = denmarkTime.toLocaleDateString("da-DK", options);
  const dateElement = document.getElementById("date");
  dateElement.textContent = dateString;

  // Add ISO datetime attribute for SEO
  const isoDate = denmarkTime.toISOString().split("T")[0];
  dateElement.setAttribute("datetime", isoDate);
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMoonTracker);
} else {
  initMoonTracker();
}
