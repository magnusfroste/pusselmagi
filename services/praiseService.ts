import { Theme } from '../types';
import { localPraise } from '../lib/artwork';

/**
 * Berömmet skapas lokalt – inga API-nycklar, inga nätanrop och inget som
 * skickar vidare något om barnet.
 */
export const generatePraise = async (
  theme: Theme,
  timeSeconds: number,
  _rows: number,
  _cols: number,
): Promise<string> => localPraise(theme, timeSeconds);

export const getThemeImagePrompt = (theme: Theme): string => {
  switch (theme) {
    case 'animals':
      return 'djur';
    case 'space':
      return 'rymden';
    case 'fantasy':
      return 'sagor';
    case 'nature':
      return 'naturen';
    default:
      return 'färger';
  }
};
