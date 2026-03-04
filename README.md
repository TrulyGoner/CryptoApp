# 🪙 Crypto Tracker

Real-time cryptocurrency tracker built with React + TypeScript + Vite.

## Features

- Search & follow cryptocurrencies via CryptoCompare API
- Autocomplete search with live price preview
- Auto-refresh every 10 seconds with trend indicators (▲ ▼ —)
- Persistent coin list & prices via localStorage
- Online/offline status indicator
- Dark theme with adaptive favicon

## Tech Stack

React 19, TypeScript, Vite, CryptoCompare API

## Project Structure

```
src/
├── app/          # App shell, global styles
├── pages/        # CryptoPage — main page logic
├── components/   # CryptoItem, SearchBar
├── entities/     # Crypto data model (types, factory)
└── shared/       # API, hooks, UI kit, config, lib (storage)
```

## Getting Started

```bash
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Add your [CryptoCompare API key](https://www.cryptocompare.com/cryptopian/api-keys) to `.env`:

```
VITE_CRYPTOCOMPARE_API_KEY=your_key_here
```

Run dev server:

```bash
npm run dev
```