// ThemeContext removido: la app ya no soporta modo claro/oscuro dinámico.
// Este archivo se mantiene solo para evitar imports rotos en caso de referencias antiguas.
// Si aún existe algún import, puedes eliminarlo y usar estilos estáticos.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return {
    mode: 'light' as const,
    scheme: 'light' as const,
    setMode: () => {},
    toggle: () => {},
  } as any;
}
