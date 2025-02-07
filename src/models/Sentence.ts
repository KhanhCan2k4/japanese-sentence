export default class Sentence {
  public content: string;
  public furigana: string;
  public romaji: string;
  public en_meaning: string;
  public vn_meaning: string;

  constructor(
    content: string,
    furigana: string,
    romaji: string,
    en_meaning: string,
    vn_meaning: string
  ) {
    this.content = content;
    this.furigana = furigana;
    this.romaji = romaji;
    this.en_meaning = en_meaning;
    this.vn_meaning = vn_meaning;
  }
}
