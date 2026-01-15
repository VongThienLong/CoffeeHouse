# Backup Data System

This directory contains backup data files that are used when the backend API fails or is unavailable.

## How It Works

The backup system uses a two-tier fallback strategy:

1. **Primary**: Try to fetch data from the API
2. **Secondary (localStorage)**: If API fails, try to use previously cached data from localStorage
3. **Tertiary (default backup)**: If no cached data exists, use the default backup JSON files

## Backup Files

- `backupProducts.json` - Backup data for products
- `backupCafes.json` - Backup data for cafe menu items
- `backupNews.json` - Backup data for news/blog posts

## Features

- **Automatic caching**: When API calls succeed, data is automatically saved to localStorage
- **Graceful degradation**: Users can still browse products and menu items even when backend is down
- **User notification**: Users are notified when backup data is being used

## Updating Backup Data

To update the backup data files, simply edit the JSON files in this directory. The structure should match the API response format.

## Components Using Backup Data

- `ShopContext.jsx` - Main context provider (products, cafes)
- `ShopSection.jsx` - Product showcase section
- `ProductDetail.jsx` - Product detail page
- `NewsSection.jsx` - News/blog section
- `cafeList.jsx` - Cafe list component
