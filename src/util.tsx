import { NT_BOOKS, RCV_APP_ABBREV_MAP, Ref } from "./types";
import { Verse, MODE, Query, OT_BOOKS, BOOKS_ABBREV, ABBREV_MAP } from "./types";

interface listItem {
  title: string;
  detail: string;
  verse: Verse;
}

export function createMarkdown(
  prefs: Preferences,
  verses: Verse[] | undefined,
  filter: string | undefined,
): listItem[] {
  if (!verses) {
    return [];
  }
  return verses.map((v) => {
    let filterText = "";
    if (filter) {
      const words = v.text.split(" ");
      const filterIndex = words.findIndex((word) => word.toLowerCase().includes(filter.toLowerCase()));
      let startIndex = Math.max(0, filterIndex - 2);
      let endIndex = Math.min(words.length - 1, filterIndex + 2);
      if (startIndex === 0) {
        endIndex = Math.min(endIndex + (2 - filterIndex), words.length - 1);
      } else if (endIndex === words.length - 1) {
        startIndex = Math.max(startIndex - (2 - (words.length - 1 - filterIndex)), 0);
      }
      filterText = `${startIndex > 0 ? "..." : ""}${words.slice(startIndex, endIndex + 1).join(" ")}${endIndex < words.length - 1 ? "..." : ""}`;
    } else {
      filterText = v.text;
    }

    const title = `${v.book_name}. ${v.chapter}:${v.verse} ${filterText}`;
    const detail = `${v.book_name}. ${v.chapter}:${v.verse} ${v.text}`;
    return { title, detail, verse: v };
  });
}

export function createClipboardText(refs: Preferences, verses: Verse[] | undefined) {
  if (!verses) {
    return "";
  }
  return verses.map((v) => `${v.book_name}. ${v.chapter}:${v.verse} ${v.text}`).join("\n");
}

export function createReferenceList(verses: Verse[]) {
  const refList = verses.map((v) => `${v.book_name}. ${v.chapter}:${v.verse}`).join("; ");
  return `${refList}`;
}

/**
 * Simple parser for bible references.
 *
 * Parses "John 3:16 NIV" into { ref: "John 3:16", version: "NIV" }
 * Parses "John3:16 (NIV)" into { ref: "John 3:16", version: "NIV" }
 * Parses "John 3:16" into { ref: "John 3:16", version: undefined }
 * Parses "John3:16 (ZZZZ)" into { ref: "John 3:16 (ZZZZ)", version: undefined }
 */
export function cleanseQuery(query: string): { ref: string; mode: string | undefined } {
  console.log("query", query);
  const trimmedReference = query.trim();
  const lastWord = trimmedReference.split(" ").pop();
  const mode = lastWord ? parseOTNT(lastWord, MODE) : undefined;
  const refWithoutMode = lastWord && mode ? trimmedReference.slice(0, -lastWord.length).trim() : trimmedReference;
  return { ref: refWithoutMode, mode: mode };
}

export function mapBookToRcVAbbrev(longBookName: string): string | undefined {
  const mappedAbbrev = RCV_APP_ABBREV_MAP.get(longBookName);
  if (mappedAbbrev) {
    return mappedAbbrev;
  }
  return undefined;
}

export function getBookIndex(longBookName: string): number {
  const keysArray = Array.from(RCV_APP_ABBREV_MAP.keys());
  return keysArray.indexOf(longBookName) + 1;
}

function parseOTNT(maybeMode: string, validMode: string[]): string | undefined {
  maybeMode = maybeMode
    .replace(/[()[\]]/gi, "") // remove brackets and parentheses
    .toUpperCase();
  const isMode = validMode.some(([, mode]) => mode === maybeMode);
  return isMode ? maybeMode : undefined;
}

export function parseQuery(query: string): Query | undefined {
  if (!query) {
    return undefined;
  }

  const refs: Ref[] = [];
  let previousRef: Ref | undefined = undefined;
  // remove everything before " - "
  const queryParts = query.split(" - ");
  if (queryParts.length > 1) {
    query = queryParts[queryParts.length - 1];
    console.log("Removed first part of query before last ' - ': ", query);
  }
  const parts = query.split(/[;,]/);
  console.log("parts", parts);

  const isVerseSeparation: boolean[] = [];
  isVerseSeparation.push(false);
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === ",") {
      isVerseSeparation.push(true);
    } else if (char === ";") {
      isVerseSeparation.push(false);
    }
  }

  let filter = "";
  let verseSepIndex = 0;
  for (const part of parts) {
    if (!part.trim()) {
      continue;
    }
    const ref = parseRef(part.trim(), previousRef, isVerseSeparation[verseSepIndex]);
    verseSepIndex++;
    if (ref) {
      refs.push(ref);
      previousRef = ref;
    } else {
      filter = part;
    }
  }
  console.log("refs", refs);
  console.log("filter", filter);
  return { filter: filter, refs };
}

function containsBibleBook(ref: string): boolean {
  const allBooks = [...OT_BOOKS, ...NT_BOOKS, ...BOOKS_ABBREV, ...ABBREV_MAP.keys()];
  return allBooks.some((book) => book.toLowerCase() === ref.toLowerCase());
}

/**
 * Parses a single reference string into a Ref object.
 * Supports the following formats:
 * - John 3:16
 * - John 3:16-17
 * - John 3:16-4:17
 * - John 3:16-4
 * - 3:16-17
 * - 16-17
 *
 * @param ref Reference string to parse
 * @param previousRef Previous reference object to use for context
 * @param isVerseSeparation Whether the current ref is a verse separation
 * @returns Parsed Ref object or undefined if the ref is invalid
 */
export function parseRef(ref: string, previousRef: Ref | undefined, isVerseSeparation: boolean): Ref | undefined {
  // supports 1.Mose 18:10-15; 21:1-3, 6-7, 5-19:3; 2.Mose 1:1-3:4
  const regex = /^(\d?\s*\.?\s?\w+)?\.?\s*(\d+)?(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/;
  //              1 book                  2 cFr/vFr  3 vFrom   4 cTo/vTo  5 vTo

  ref = ref
    .trim()
    .replace(/[.,?!":]$/, "")
    .replace(/["'`*']/g, "");
  console.log("ref", ref);
  const match = ref.match(regex);
  if (!match) {
    const bookRef = ref.replace(/\s|\./g, "");
    if (containsBibleBook(bookRef)) {
      return { book: bookRef, chapterFrom: undefined, verseFrom: undefined, chapterTo: undefined, verseTo: undefined };
    }
    console.error(`Error parsing ref: invalid format for reference '${ref}'`);
    return undefined;
  }
  const parsedRef: Ref = {
    book: "",
    chapterFrom: undefined,
    verseFrom: undefined,
    chapterTo: undefined,
    verseTo: undefined,
  };

  if (isVerseSeparation) {
    // only verse or verse range (e.g. 1, 1-3) is given in the current ref
    // so we should use the book and chapter from the previous ref
    if (!previousRef || !previousRef.book || !previousRef.chapterFrom) {
      console.log(
        `Error parsing verse range: book and chapter must be defined in the previous ref '${previousRef}' (current ref: '${ref}')`,
      );
      return undefined;
    }
    parsedRef.book = previousRef.book;
    parsedRef.chapterFrom = previousRef.chapterFrom;
    if (match[2] || match[1]) {
      // verseFrom
      if (match[1]) {
        parsedRef.verseFrom = parseInt(match[1]);
      } else {
        parsedRef.verseFrom = parseInt(match[2]);
      }
    }
    if (match[4]) {
      if (match[5]) {
        // verse range
        parsedRef.chapterTo = parseInt(match[4]);
        parsedRef.verseTo = parseInt(match[5]);
      } else {
        // verseTo
        parsedRef.verseTo = parseInt(match[4]);
      }
    }
    if (match[3]) {
      // invalid format for verse range
      console.log(`Error parsing verse range: invalid format for verse range in ref '${ref}'`);
      return undefined;
    }

    return parsedRef;
  }

  // reference is either only book or includes chapter reference
  if (match[1]) {
    // book, e.g. John
    const book = match[1].replace(/\s|\./g, "");
    const isOT = OT_BOOKS.includes(book);
    const isNT = NT_BOOKS.includes(book);
    const isAbbrev = BOOKS_ABBREV.includes(book);
    const mappedAbbrev = ABBREV_MAP.get(book);
    if (!isOT && !isNT && !isAbbrev && !mappedAbbrev) {
      return undefined;
    } else {
      if (mappedAbbrev) {
        parsedRef.book = mappedAbbrev;
      } else {
        parsedRef.book = book;
      }
    }
  } else if (previousRef) {
    parsedRef.book = previousRef.book;
  } else {
    console.log(`Error parsing ref: book must be defined in the reference '${
      ref
    }' or in the previous ref '${previousRef}'
      `);
    return undefined;
  }

  if (match[2] && match[3]) {
    // match[2] is chapterFrom, match[3] is verse, e.g. John 1:1(-3(:4)?)?
    parsedRef.chapterFrom = parseInt(match[2]);
    parsedRef.verseFrom = parseInt(match[3]);
    if (match[4]) {
      // chapterTo or verseTo
      if (match[5]) {
        // John 1:1-3:4
        parsedRef.chapterTo = parseInt(match[4]);
        parsedRef.verseTo = parseInt(match[5]);
      } else {
        // John 1:1-3
        parsedRef.verseTo = parseInt(match[4]);
      }
    }
  } else if (match[2]) {
    // match[2] is chapterFrom, match[3] is not given, e.g. John 1(-3(:4)?)?
    parsedRef.chapterFrom = parseInt(match[2]);
    if (match[4]) {
      // chapterTo or verseTo
      if (match[5]) {
        // John 1-3:4
        parsedRef.chapterTo = parseInt(match[4]);
        parsedRef.verseTo = parseInt(match[5]);
      } else {
        // John 1-3
        parsedRef.chapterTo = parseInt(match[4]);
      }
    }
  }
  return parsedRef;
}
