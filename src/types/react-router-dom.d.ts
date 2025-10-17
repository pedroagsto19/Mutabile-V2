declare module 'react-router-dom' {
  import * as React from 'react';

  interface NavigateOptions {
    replace?: boolean;
  }

  interface Location {
    pathname: string;
    search: string;
    hash: string;
  }

  export function BrowserRouter(props: { children?: React.ReactNode }): JSX.Element;
  export function Routes(props: { children?: React.ReactNode }): JSX.Element | null;
  export function Route(props: { path: string; element: React.ReactNode }): JSX.Element | null;
  export function Navigate(props: { to: string; replace?: boolean }): null;
  export function useNavigate(): (to: string, options?: NavigateOptions) => void;
  export function useLocation(): Location;
  export function useParams<Params extends Record<string, string> = Record<string, string>>(): Params;
}
