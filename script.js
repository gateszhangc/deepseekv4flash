const topbar = document.querySelector("[data-topbar]");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll("[data-nav-target]");
const sections = document.querySelectorAll("[data-section]");
const year = document.getElementById("year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const syncTopbar = () => {
  if (!topbar) {
    return;
  }

  topbar.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncTopbar();
window.addEventListener("scroll", syncTopbar, { passive: true });

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      }
    },
    {
      threshold: 0.18
    }
  );

  for (const item of revealItems) {
    revealObserver.observe(item);
  }

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) {
        return;
      }

      const sectionName = visible.target.getAttribute("data-section");

      for (const link of navLinks) {
        const isCurrent = link.getAttribute("data-nav-target") === sectionName;
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    },
    {
      rootMargin: "-25% 0px -45% 0px",
      threshold: [0.2, 0.4, 0.6]
    }
  );

  for (const section of sections) {
    navObserver.observe(section);
  }
} else {
  for (const item of revealItems) {
    item.classList.add("is-visible");
  }
}
