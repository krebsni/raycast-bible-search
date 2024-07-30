import { Database } from "better-sqlite3";
import { OT_BOOKS, NT_BOOKS, QueryAndMode, Verse } from "./types";

export async function searchVersesFromDB(queryAndMode: QueryAndMode, db: Database): Promise<Verse[]> {
  // function searchVersesFromDB(queryAndMode: QueryAndMode): VerseListLoading {
  let sqlQuery = "";
  const { query, otnt } = queryAndMode;
  if (!query) {
    const book = otnt === "OT" ? "Genesis" : "Matthew";

    sqlQuery = `
    SELECT v.book_number, v.chapter, v.verse, v.text, b.short_name as book_name, b.long_name as book_name_long
    FROM verses v
    JOIN books b ON v.book_number = b.book_number
    WHERE b.long_name IN ('${book}')
    LIMIT 100`;
  } else {
    const { filter, refs } = query;

    sqlQuery = `
    SELECT v.book_number, v.chapter, v.verse, v.text, b.short_name as book_name, b.long_name as book_name_long
    FROM verses v
    JOIN books b ON v.book_number = b.book_number WHERE 1=1`;

    // Filter by verse references
    if (refs && refs.length > 0) {
      const refQueries = refs.map((ref) => {
        const { book, chapterFrom, verseFrom, chapterTo, verseTo } = ref;
        let sqlSubQuery = "(1=1";
        if (book) {
          sqlSubQuery += ` AND (LOWER(b.long_name) = '${book.toLowerCase()}' or LOWER(b.short_name) = '${book.toLowerCase()}')`;
        }

        if (chapterFrom) {
          sqlSubQuery += " AND (1=1";
          sqlSubQuery += ` AND (v.chapter = ${chapterFrom}`;
          if (verseFrom) {
            if (verseTo && (!chapterTo || chapterTo === chapterFrom)) {
              sqlSubQuery += ` AND v.verse >= ${verseFrom} AND v.verse <= ${verseTo}`;
            } else {
              sqlSubQuery += ` AND v.verse >= ${verseFrom}`;
            }
          }
          sqlSubQuery += ")";
          if (chapterTo && chapterTo !== chapterFrom) {
            if (chapterTo >= chapterFrom + 2) {
              sqlSubQuery += ` OR (v.chapter < ${chapterTo} and v.chapter > ${chapterFrom})`;
            }
            sqlSubQuery += ` OR (v.chapter = ${chapterTo}`;
            if (verseTo) {
              sqlSubQuery += ` AND v.verse <= ${verseTo}`;
            }
            sqlSubQuery += ")";
          } else if (verseTo || verseFrom) {
            const maxVerse = verseTo ? Math.max(verseFrom ? verseFrom : 0, verseTo) : verseFrom;
            sqlSubQuery += ` AND v.verse <= ${maxVerse}`;
          }
          sqlSubQuery += ")";
        }
        sqlSubQuery += ")";
        return sqlSubQuery;
      });
      sqlQuery += ` AND (${refQueries.join(" OR ")})`;
    } else {
      const bookList: string[] = otnt === "OT" ? OT_BOOKS : NT_BOOKS;
      const books = bookList.join("', '");
      console.log("otnt", otnt);
      sqlQuery += ` AND b.short_name IN ('${books}')`;
    }

    // Filter by text
    if (filter && filter.trim()) {
      sqlQuery += ` AND LOWER(v.text) LIKE '%${filter.trim().toLowerCase()}%'`;
    }
  }
  console.log("sqlQuery", sqlQuery);
  const stmt = db.prepare(sqlQuery);
  const verses = stmt.all();

  return verses as Verse[];
}
