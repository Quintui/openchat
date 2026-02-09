/*
  Adapted from next-themes to work with TanStack Start.
  Original: https://github.com/pacocoursey/next-themes (MIT license)
*/

import * as React from "react";

interface ValueObject {
  [themeName: string]: string;
}

export interface UseThemeProps {
  themes: string[];
  forcedTheme?: string | undefined;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  theme?: string | undefined;
  systemTheme?: "dark" | "light" | undefined;
}

export type Attribute = `data-${string}` | "class";

export interface ThemeProviderProps extends React.PropsWithChildren {
  themes?: string[] | undefined;
  forcedTheme?: string | undefined;
  enableSystem?: boolean | undefined;
  disableTransitionOnChange?: boolean | undefined;
  enableColorScheme?: boolean | undefined;
  storageKey?: string | undefined;
  defaultTheme?: string | undefined;
  attribute?: Attribute | Attribute[] | undefined;
  value?: ValueObject | undefined;
  nonce?: string | undefined;
}

const colorSchemes = ["light", "dark"];
const MEDIA = "(prefers-color-scheme: dark)";
const isServer = typeof window === "undefined";
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined);
const defaultContext: UseThemeProps = { setTheme: (_) => {}, themes: [] };

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext;

export const ThemeProvider = (props: ThemeProviderProps): React.ReactNode => {
  const context = React.useContext(ThemeContext);
  if (context) return props.children;
  return <Theme {...props} />;
};

const defaultThemes = ["light", "dark"];

const Theme = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = "theme",
  themes = defaultThemes,
  defaultTheme = enableSystem ? "system" : "light",
  attribute = "class",
  value,
  children,
  nonce,
}: ThemeProviderProps) => {
  const [theme, setThemeState] = React.useState(() => getTheme(storageKey, defaultTheme));
  const attrs = !value ? themes : Object.values(value);

  const applyTheme = React.useCallback(
    (theme: string | undefined) => {
      let resolved = theme;
      if (!resolved) return;

      if (theme === "system" && enableSystem) {
        resolved = getSystemTheme();
      }

      const name = value ? value[resolved] : resolved;
      const enable = disableTransitionOnChange ? disableAnimation() : null;
      const d = document.documentElement;

      const handleAttribute = (attr: Attribute) => {
        if (attr === "class") {
          d.classList.remove(...attrs);
          if (name) d.classList.add(name);
        } else if (attr.startsWith("data-")) {
          if (name) {
            d.setAttribute(attr, name);
          } else {
            d.removeAttribute(attr);
          }
        }
      };

      if (Array.isArray(attribute)) attribute.forEach(handleAttribute);
      else handleAttribute(attribute);

      if (enableColorScheme) {
        const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null;
        const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback;
        d.style.colorScheme = colorScheme as string;
      }

      enable?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setTheme = React.useCallback(
    (value: React.SetStateAction<string>) => {
      const newTheme = typeof value === "function" ? value(theme ?? "") : value;
      setThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (_e) {
        // Unsupported
      }
    },
    [theme, storageKey],
  );

  const handleMediaQuery = React.useCallback(
    (_e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === "system" && enableSystem && !forcedTheme) {
        applyTheme("system");
      }
    },
    [theme, forcedTheme, enableSystem, applyTheme],
  );

  React.useEffect(() => {
    const media = window.matchMedia(MEDIA);
    media.addEventListener("change", handleMediaQuery);
    handleMediaQuery(media);
    return () => media.removeEventListener("change", handleMediaQuery);
  }, [handleMediaQuery]);

  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const theme = e.newValue || defaultTheme;
      setTheme(theme);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTheme]);

  React.useEffect(() => {
    applyTheme(forcedTheme ?? theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedTheme, theme]);

  const providerValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      forcedTheme,
      themes: enableSystem ? [...themes, "system"] : themes,
    }),
    [theme, setTheme, forcedTheme, enableSystem, themes],
  );

  return (
    <ThemeContext.Provider value={providerValue}>
      <ThemeScript
        {...{
          forcedTheme,
          storageKey,
          attribute,
          enableSystem,
          enableColorScheme,
          defaultTheme,
          value,
          themes,
          nonce,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeScript = React.memo(
  ({
    forcedTheme,
    storageKey,
    attribute,
    enableSystem,
    enableColorScheme,
    defaultTheme,
    value,
    themes,
    nonce,
  }: Omit<ThemeProviderProps, "children"> & { defaultTheme: string }) => {
    const scriptArgs = JSON.stringify([
      attribute,
      storageKey,
      defaultTheme,
      forcedTheme,
      themes,
      value,
      enableSystem,
      enableColorScheme,
    ]).slice(1, -1);

    return (
      <script
        suppressHydrationWarning
        nonce={typeof window === "undefined" ? nonce : ""}
        dangerouslySetInnerHTML={{
          __html: `(${script.toString()})(${scriptArgs})`,
        }}
      />
    );
  },
);

// Helpers
const getTheme = (key: string, fallback?: string) => {
  if (isServer) return undefined;
  let theme: string | undefined;
  try {
    theme = localStorage.getItem(key) || undefined;
  } catch (_e) {
    // Unsupported
  }
  return theme || fallback;
};

const disableAnimation = () => {
  const css = document.createElement("style");
  css.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
    ),
  );
  document.head.appendChild(css);

  return () => {
    (() => window.getComputedStyle(document.body))();
    setTimeout(() => {
      document.head.removeChild(css);
    }, 1);
  };
};

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  const event = e ?? window.matchMedia(MEDIA);
  const isDark = event.matches;
  return isDark ? "dark" : "light";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const script: (...args: any[]) => void = (
  attribute,
  storageKey,
  defaultTheme,
  forcedTheme,
  themes,
  value,
  enableSystem,
  enableColorScheme,
) => {
  const el = document.documentElement;
  const systemThemes = ["light", "dark"];
  const isClass = attribute === "class";
  const classes = isClass && value ? themes.map((t: string | number) => value[t] || t) : themes;

  function updateDOM(theme: string) {
    if (isClass) {
      el.classList.remove(...classes);
      el.classList.add(theme);
    } else {
      el.setAttribute(attribute, theme);
    }
    setColorScheme(theme);
  }

  function setColorScheme(theme: string) {
    if (enableColorScheme && systemThemes.includes(theme)) {
      el.style.colorScheme = theme;
    }
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  if (forcedTheme) {
    updateDOM(forcedTheme);
  } else {
    try {
      const themeName = localStorage.getItem(storageKey) || defaultTheme;
      const isSystem = enableSystem && themeName === "system";
      const theme = isSystem ? getSystemTheme() : themeName;
      updateDOM(theme);
    } catch (_e) {
      //
    }
  }
};
