import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import './index.css';
import App from './App';
import theme from './theme';
import { registerAutoValidator } from './validatePipeline';

// Wire the store's debounced auto-validate hook (Req 8.9, 8.10) to the
// actual POST /pipelines/parse runner. Done once at module import so it
// survives StrictMode's double-effect invocation without re-allocating.
registerAutoValidator();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
