// =======================================================================
// theme.js — JJRB Tema Dinámico por Día de la Semana
// Cambia los colores de acento según el día (Lunes → Domingo)
// =======================================================================

(function applyDayTheme() {
    const dayColors = {
        0: { primary: '#7c3aed', secondary: '#6d28d9', glow: 'rgba(124,58,237,0.25)' }, // Domingo
        1: { primary: '#6d28d9', secondary: '#3b82f6', glow: 'rgba(109,40,217,0.25)' }, // Lunes
        2: { primary: '#2563eb', secondary: '#0891b2', glow: 'rgba(37,99,235,0.25)' }, // Martes
        3: { primary: '#0891b2', secondary: '#059669', glow: 'rgba(8,145,178,0.25)' }, // Miércoles
        4: { primary: '#059669', secondary: '#d97706', glow: 'rgba(5,150,105,0.25)' }, // Jueves
        5: { primary: '#d97706', secondary: '#dc2626', glow: 'rgba(217,119,6,0.25)' }, // Viernes
        6: { primary: '#dc2626', secondary: '#7c3aed', glow: 'rgba(220,38,38,0.25)' } // Sábado
    };

    const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ...
    const colors = dayColors[today] || dayColors[1]; // fallback a Lunes

    const root = document.documentElement;
    root.style.setProperty('--neon-purple', colors.primary);
    root.style.setProperty('--neon-blue', colors.secondary);
    root.style.setProperty('--glow-color', colors.glow);

    // Opcional: mostrar el día actual en consola (para debugging)
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    console.log(`[Theme] Hoy es ${dayNames[today]} — Colores aplicados: ${colors.primary} / ${colors.secondary}`);
})();