function adjustBrightness(color, percent) {
    const hslRegex = /hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/;
    const match = color.match(hslRegex);
    if (match) {
        const [, hue, saturation, lightness] = match;
        const newLightness = Math.min(100, Math.max(0, parseFloat(lightness) + percent));
        return `hsl(${hue}, ${saturation}%, ${newLightness}%)`;
    }
    return color;
}

// Dark - for background, empty cells
// Black
export const COLOR_DARK = 'hsl(0, 0%, 9%)'; 
export const COLOR_DARK_LIGHTER = adjustBrightness(COLOR_DARK, 5);
export const COLOR_DARK_DARKER = adjustBrightness(COLOR_DARK, -5);

// Neutral - for temporary blocked cells
// Gray
export const COLOR_NEUTRAL = 'hsl(26, 7%, 42%)'; 
export const COLOR_NEUTRAL_LIGHTER = adjustBrightness(COLOR_NEUTRAL, 5);
export const COLOR_NEUTRAL_DARKER = adjustBrightness(COLOR_NEUTRAL, -5);

// Highlight - for text, grid outlines, permanently blocked cells, active player outline
// White
export const COLOR_HIGHLIGHT = 'hsl(46, 32%, 92%)'; 
export const COLOR_HIGHLIGHT_LIGHTER = adjustBrightness(COLOR_HIGHLIGHT, 5);
export const COLOR_HIGHLIGHT_DARKER = adjustBrightness(COLOR_HIGHLIGHT, -5);

// Team 1 - for team 1's cells, team 1's text, some buttons
// Blue
export const COLOR_TEAM_1 = 'hsl(217, 100%, 56%)'; 
export const COLOR_TEAM_1_LIGHTER = adjustBrightness(COLOR_TEAM_1, 5);
export const COLOR_TEAM_1_DARKER = adjustBrightness(COLOR_TEAM_1, -5);

// Team 2 - for team 2's cells, team 2's text, some buttons
// Green
export const COLOR_TEAM_2 = 'hsl(165, 78%, 41%)'; 
export const COLOR_TEAM_2_LIGHTER = adjustBrightness(COLOR_TEAM_2, 5);
export const COLOR_TEAM_2_DARKER = adjustBrightness(COLOR_TEAM_2, -5);
