import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  fonts: {
    heading:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
    body:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
    mono:
      "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },

  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },

    toolbar: {
      bg: '#1C2536',
      fg: '#F8FAFC',
      border: '#334155',
    },

    canvas: {
      bg: '#F1F5F9',
      grid: '#CBD5E1',
    },

    nodeAccent: {
      io: '#22c55e',
      ai: '#a855f7',
      data: '#06b6d4',
      transform: '#f97316',
      integration: '#3b82f6',
      utility: '#f59e0b',
      logic: '#ef4444',
    },
  },

  semanticTokens: {
    colors: {
      'node.bg': { default: 'white' },
      'node.border': { default: 'gray.200' },
      'node.borderHover': { default: 'brand.500' },
      'node.text': { default: 'gray.800' },
      'node.textMuted': { default: 'gray.500' },
      'node.titleFg': { default: 'white' },
    },
  },

  radii: {
    node: '12px',
  },

  shadows: {
    node: '0 2px 8px rgba(0, 0, 0, 0.08)',
    nodeHover: '0 4px 16px rgba(0, 0, 0, 0.14)',
    nodeSelected: '0 0 0 2px #6366f1, 0 4px 16px rgba(0, 0, 0, 0.14)',
  },

  styles: {
    global: {
      body: {
        bg: 'canvas.bg',
        color: 'gray.800',
      },
    },
  },

  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export default theme;
