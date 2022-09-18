import { BuffId } from 'src/app/logs/models/buff-id.enum';

export class Settings {
  public hasteRating: number|null = null;
  public improvedMindBlast = 5;
  public improvedMoonkinAura = true;
  public improvedRetAura = true;
  public wrathOfAir = false;
  public auras: number[] = [];

  constructor(settings?: ISettings) {
    if (settings) {
      this.hasteRating = settings.hasteRating;
      this.improvedMindBlast = settings.improvedMindBlast;
      this.improvedMoonkinAura = settings.improvedMoonkinAura;
      this.improvedRetAura = settings.improvedRetAura;
      this.wrathOfAir = settings.wrathOfAir;
      this.auras = settings.auras || [];
    }
  }

  haveAura(id: BuffId) {
    return this.auras?.some((a) => a === id) || false;
  }
}

export interface ISettings {
  hasteRating: number|null;
  improvedMindBlast: number;
  improvedMoonkinAura: boolean;
  improvedRetAura: boolean;
  wrathOfAir: boolean;
  auras?: number[];
}