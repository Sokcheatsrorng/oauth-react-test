import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId='60617148087-m8oiv1mq8uv7fr3i2j9ssmtgacmnfqd4.apps.googleusercontent.com'>
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  </GoogleOAuthProvider>
)


// index.js
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import { Provider } from 'react-redux'
// import store from './store'

// const rootElement = document.getElementById('root');
// if (rootElement) {
//   const root = ReactDOM.createRoot(rootElement);
//   root.render(
//     <React.StrictMode>
//       <Provider store={store}>
//         <App />
//       </Provider>
//     </React.StrictMode>
//   );
// } else {
//   console.error('Failed to find the root element');
// }