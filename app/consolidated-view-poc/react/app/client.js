/* eslint-env browser */
import { createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { App } from './App.js'

hydrateRoot(
  document,
  createElement(App, JSON.parse(document.getElementById('initial-props').textContent))
)
