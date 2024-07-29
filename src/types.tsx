export const NT_BOOKS = [
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

export const BOOKS_ABBREV = [
  "Gen",
  "Exo",
  "Lev",
  "Num",
  "Deu",
  "Josh",
  "Judg",
  "Ruth",
  "1Sam",
  "2Sam",
  "1Kin",
  "2Kin",
  "1Chr",
  "2Chr",
  "Ezr",
  "Neh",
  "Esth",
  "Job",
  "Ps",
  "Prov",
  "Eccl",
  "Song",
  "Isa",
  "Jer",
  "Lam",
  "Ezek",
  "Dan",
  "Hos",
  "Joel",
  "Am",
  "Oba",
  "Jona",
  "Mic",
  "Nah",
  "Hab",
  "Zeph",
  "Hag",
  "Zech",
  "Mal",
  "Mat",
  "Mar",
  "Luk",
  "John",
  "Acts",
  "Rom",
  "1Cor",
  "2Cor",
  "Gal",
  "Eph",
  "Phil",
  "Col",
  "1Ths",
  "2Ths",
  "1Tim",
  "2Tim",
  "Tit",
  "Phlm",
  "Heb",
  "Jam",
  "1Pet",
  "2Pet",
  "1Jn",
  "2Jn",
  "3Jn",
  "Jud",
  "Rev",
];

export const ABBREV_MAP = new Map<string, string>([
  ["1John", "1Jn"],
  ["2John", "2Jn"],
  ["3John", "3Jn"],
  ["1Thse", "1Ths"],
  ["2Thes", "2Ths"],
  ["Matt", "Mat"],
  ["Mk", "Mar"],
  ["Lk", "Luk"],
  ["Hebr", "Heb"],
  ["Jd", "Jude"],
  ["Deut", "Deu"],
  ["Ob", "Oba"],
]);

export const OT_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
];

export const MODE = ["OT", "NT", "OT+NT"];

export interface Ref {
  book: string;
  chapterFrom: number | undefined;
  verseFrom: number | undefined;
  chapterTo: number | undefined;
  verseTo: number | undefined;
}

export interface Verse {
  book_number: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseListLoading {
  isLoading: boolean;
  data: Verse[] | undefined;
  permissionView: JSX.Element | undefined;
}

export interface Query {
  filter: string | undefined;
  refs: Ref[] | undefined;
}

export interface QueryAndMode {
  query: Query | undefined;
  otnt: string;
}
