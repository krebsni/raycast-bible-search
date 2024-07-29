import {
  Action,
  ActionPanel,
  getPreferenceValues,
  getSelectedText,
  Icon,
  LaunchProps,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect, useCallback, useMemo } from "react";

import Database from "better-sqlite3";

import path, { resolve } from "path";
import { homedir } from "os";
import { MODE, Verse } from "./types";
import { searchVersesFromDB } from "./db";
import { cleanseQuery, createClipboardText, createMarkdown, createReferenceList, parseQuery } from "./util";

const BASE_PATH = resolve(homedir(), "Documents/dev-tools/search-bible");
const DB_FOLDER = path.join(BASE_PATH, "assets/RcV'03.SQLite3");
const db = new Database(DB_FOLDER, {
  nativeBinding: path.join(BASE_PATH, "node_modules/better-sqlite3/build/Release/better_sqlite3.node"),
});
type Preferences = Preferences.SearchBible;

export default function Command(props: LaunchProps<{ arguments: Arguments.SearchBible }>) {
  const prefs = getPreferenceValues<Preferences>();
  const { search = "", otnt = "OT+NT" } = props.arguments;
  const [currentQuery, setQuery] = useState({ search: search, otnt: otnt.trim().toUpperCase() });
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Verse[] | undefined>(undefined);
  // const [permissionView, setPermissionView] = useState<JSX.Element | undefined>(undefined);

  useEffect(() => {
    async function setSelectedTextAsQuery() {
      try {
        const query = await getSelectedText();
        console.log("query", query);
        if (query) {
          const { ref, mode } = cleanseQuery(query);
          console.log("cleansedQuery", ref + " " + mode);
          setQuery((old) => ({ ...old, search: ref, otnt: mode || old.otnt }));
        }
      } catch (error) {
        /* empty */
      }
    }

    setSelectedTextAsQuery();
  }, []);

  const performSearch = useCallback(async () => {
    if (currentQuery.search === "") {
      setSearchResult(undefined);
      return;
    }

    setIsLoading(true);
    try {
      const queryAndMode = { query: parseQuery(currentQuery.search), otnt: currentQuery.otnt };
      console.log("queryAndMode", queryAndMode);
      const verses: Verse[] = await searchVersesFromDB(queryAndMode, db);
      setSearchResult(verses);
    } catch (error) {
      if (error instanceof Error) {
        showToast({ title: "Error", message: error.message, style: Toast.Style.Failure });
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentQuery.otnt, currentQuery.search]);

  useEffect(() => {
    // Don't search when query changes if the user only wants to search when they press enter.
    if (!prefs.enterToSearch) {
      performSearch();
    }
  }, [performSearch, prefs.enterToSearch]);

  const detailContent = useMemo(() => {
    if (!(searchResult && searchResult.length > 0)) return null;
    return { markdown: createMarkdown(prefs, searchResult), clipboardText: createClipboardText(prefs, searchResult) };
  }, [prefs, searchResult]);

  function getEmptyViewText() {
    if (isLoading) {
      return "Searching...";
    } else if (prefs.enterToSearch && searchResult === undefined) {
      return "Press Enter to Search";
    } else if (currentQuery.search === "") {
      return "Start Typing to Search";
    } else {
      return "No Results";
    }
  }

  const searchAction = <Action title="Search" icon={Icon.Binoculars} onAction={performSearch} />;
  return (
    <List
      isLoading={isLoading}
      isShowingDetail={searchResult && searchResult.length > 0}
      searchText={currentQuery.search}
      throttle={true}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Bible Version"
          onChange={(version) => setQuery((old) => ({ ...old, version }))}
          value={otnt || ""}
          defaultValue={"OT+NT"}
        >
          {MODE.map((mode) => (
            <List.Dropdown.Item title={mode} value={mode} key={mode} />
          ))}
        </List.Dropdown>
      }
      onSearchTextChange={(newQuery) => setQuery((old) => ({ ...old, search: newQuery }))}
    >
      {searchResult && searchResult.length > 0 && detailContent ? (
        <List.Item
          title={createReferenceList(searchResult)}
          detail={<List.Item.Detail markdown={detailContent.markdown} />}
          actions={
            <ActionPanel>
              {prefs.enterToSearch && searchAction}
              <Action.CopyToClipboard content={detailContent.clipboardText} />
              <Action.Paste
                content={detailContent.clipboardText}
                shortcut={{ modifiers: ["cmd", "shift"], key: "enter" }}
              />
              <Action.OpenInBrowser
                title="Open at BibleGateway.com"
                url={""}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          title={getEmptyViewText()}
          icon="../assets/extension-icon-64.png"
          actions={<ActionPanel>{prefs.enterToSearch && searchAction}</ActionPanel>}
        />
      )}
    </List>
  );
}
