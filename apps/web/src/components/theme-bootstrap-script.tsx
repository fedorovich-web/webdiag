import { themeStorageKey } from "../lib/theme";

export function getThemeBootstrapScript(): string {
  const key = JSON.stringify(themeStorageKey);
  return `try{var k=${key};var s=localStorage.getItem(k);var t=s==='dark'?'dark':'light';document.body.dataset.theme=t;if(s!==null&&s!==t){localStorage.setItem(k,t)}}catch(e){document.body.dataset.theme='light'}`;
}

export function ThemeBootstrapScript() {
  return <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />;
}
