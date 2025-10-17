import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Location = {
  pathname: string;
  search: string;
  hash: string;
};

type NavigateOptions = {
  replace?: boolean;
};

type RouterContextValue = {
  location: Location;
  navigate: (to: string, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});

const getWindowLocation = (): Location => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  };
};

const resolvePath = (from: string, to: string): string => {
  if (to.startsWith('/')) return to;

  const fromSegments = from.replace(/\/*$/, '').split('/');
  const toSegments = to.split('/');
  const result: string[] = [];

  [...fromSegments, ...toSegments].forEach(segment => {
    if (!segment || segment === '.') return;
    if (segment === '..') {
      result.pop();
    } else {
      result.push(segment);
    }
  });

  return '/' + result.join('/');
};

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location>(() => getWindowLocation());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setLocation(getWindowLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    if (typeof window === 'undefined') return;

    const target = resolvePath(location.pathname, to);
    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    setLocation(getWindowLocation());
  }, [location.pathname]);

  const value = useMemo<RouterContextValue>(() => ({
    location,
    navigate
  }), [location, navigate]);

  return (
    <RouterContext.Provider value={value}>
      <ParamsContext.Provider value={{}}>
        {children}
      </ParamsContext.Provider>
    </RouterContext.Provider>
  );
}

interface RouteProps {
  path: string;
  element: React.ReactNode;
}

const compilePath = (path: string) => {
  const paramNames: string[] = [];
  const escaped = path
    .replace(/[-{}()+?.,\\^$|#\s]/g, '\\$&')
    .replace(/:(\w+)/g, (_, key) => {
      paramNames.push(key);
      return '([^/]+)';
    });

  const regex = new RegExp(`^${escaped}$`);
  return { regex, paramNames };
};

const matchPath = (routePath: string, pathname: string) => {
  if (routePath === '*') {
    return {};
  }

  const hasWildcard = routePath.endsWith('/*');
  const basePath = hasWildcard
    ? routePath.slice(0, -2) || '/'
    : routePath || '/';

  const { regex, paramNames } = compilePath(basePath);
  const match = regex.exec(pathname);
  if (!match) {
    if (hasWildcard) {
      const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
      if (pathname.startsWith(normalizedBase)) {
        return {};
      }
    }
    return null;
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });
  return params;
};

export function Routes({ children }: { children: React.ReactNode }) {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('Routes must be used within a BrowserRouter');
  }

  const childArray = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

  for (const child of childArray) {
    const { path, element } = child.props;
    const params = matchPath(path, router.location.pathname);
    if (params) {
      return (
        <ParamsContext.Provider value={params}>
          {element}
        </ParamsContext.Provider>
      );
    }
  }

  return null;
}

export function Route(_props: RouteProps) {
  return null;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

export function useNavigate() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('useNavigate must be used within a BrowserRouter');
  }
  return useCallback((to: string, options?: NavigateOptions) => {
    router.navigate(to, options);
  }, [router]);
}

export function useLocation() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('useLocation must be used within a BrowserRouter');
  }
  return router.location;
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useContext(ParamsContext) as T;
}
