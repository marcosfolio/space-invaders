import { GERION_INVADER_FRAMES } from '../invaders/gerion.js';
import { OCTOPUS_INVADER_FRAMES } from '../invaders/octopus.js';
import { CRAB_INVADER_FRAMES } from '../invaders/crab.js';
import { MADUSA_INVADER_FRAMES } from '../invaders/madusa.js';
import { SQUID_INVADER_FRAMES } from '../invaders/squid.js';
import { ORANGE_INVADER_FRAMES } from '../invaders/orange.js';
import { LIGHT_BLUE_INVADER_FRAMES } from '../invaders/light_blue.js';
import { UGLY_INVADER_FRAMES } from '../invaders/ugly.js';

export const INVADER_COLORS = {
    ugly: '#4CAF50',      // Forest green
    octopus: '#FFFF00',   // Yellow
    crab: '#00FFFF',      // Cyan
    squid: '#FF69B4',     // Pink (Hot Pink)
    madusa: '#FF00FF',    // Magenta
    orange: '#FFA500',    // Orange
    lightBlue: '#ADD8E6', // Light Blue
    gerion: '#FFFFFF'     // Gerion
};

export class PixelInvaderFactory {
    static create() {
        const invaderType = Math.floor(Math.random() * 8);
        let pixelMap;
        let color;
        let isAnimated = false;

        switch (invaderType) {
            case 0:
                pixelMap = GERION_INVADER_FRAMES[0];
                color = INVADER_COLORS.gerion;
                isAnimated = true;
                break;
            case 1:
                pixelMap = OCTOPUS_INVADER_FRAMES[0];
                color = INVADER_COLORS.octopus;
                isAnimated = true;
                break;
            case 2:
                pixelMap = CRAB_INVADER_FRAMES[0];
                color = INVADER_COLORS.crab;
                isAnimated = true;
                break;
            case 3:
                pixelMap = MADUSA_INVADER_FRAMES[0];
                color = INVADER_COLORS.madusa;
                isAnimated = true;
                break;
            case 4:
                pixelMap = SQUID_INVADER_FRAMES[0];
                color = INVADER_COLORS.squid;
                isAnimated = true;
                break;
            case 5:
                pixelMap = ORANGE_INVADER_FRAMES[0];
                color = INVADER_COLORS.orange;
                isAnimated = true;
                break;
            case 6:
                pixelMap = LIGHT_BLUE_INVADER_FRAMES[0];
                color = INVADER_COLORS.lightBlue;
                isAnimated = true;
                break;
            case 7:
                pixelMap = UGLY_INVADER_FRAMES[0];
                color = INVADER_COLORS.ugly;
                isAnimated = true;
                break;
        }

        return { pixelMap, color, isAnimated };
    }
} 