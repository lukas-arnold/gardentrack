const darkModeToggle = document.getElementById('darkModeToggle');

/**
 * Applies the stored theme or the system preference.
 */
function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>'; // Sun icon for dark mode
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>'; // Moon icon for light mode
    } else {
        // If no theme is saved, use system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
}

/**
 * Toggles dark mode and saves preference.
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Apply theme when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', applyTheme);

// Add event listener to the toggle button
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Listen for changes in system color scheme preference (only if no manual preference is set)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (!localStorage.getItem('theme')) {
        applyTheme();
    }
});