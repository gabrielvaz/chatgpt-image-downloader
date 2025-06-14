# ChatGPT Image Downloader

A Chrome extension that allows bulk downloading of images from ChatGPT's Library (https://chatgpt.com/library) with customizable filters.

## 🚀 Features

- **Download Filters**: 
  - All available images
  - Last N images
  - Images from the last X days
  - Images from a specific date
- **Automatic Download**: Downloads all selected images automatically
- **Intuitive Interface**: Simple and easy-to-use popup
- **Saves Preferences**: Remembers your settings for future use
- **Organized Storage**: Creates a dedicated folder for downloaded images

## 📦 Installation

### From Chrome Web Store (Recommended)
*Coming soon - Extension is pending review*

### Manual Installation (Developer Mode)

1. **Download** or clone this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable** "Developer mode" in the top right corner
4. **Click** "Load unpacked"
5. **Select** the extension folder (`chatgpt-image-downloader`)
6. The extension will be installed and appear in your toolbar

## 🎯 How to Use

1. **Login** to ChatGPT (https://chatgpt.com)
2. **Navigate** to the library page: https://chatgpt.com/library
3. **Click** the extension icon in your toolbar
4. **Select** your desired filter:
   - **All**: Downloads all visible images
   - **Last N**: Downloads the N most recent images
   - **Last X days**: Downloads images from the last X days
   - **Specific date**: Downloads images from a specific date
5. **Click** "Start Download"
6. Images will be automatically downloaded to `Downloads/ChatGPT-Images/`

## 🔧 Technical Details

### Built With
- **Manifest V3**: Latest Chrome extension API
- **Modern JavaScript**: ES6+ with async/await
- **CSS3**: Modern responsive design
- **Chrome APIs**: Downloads, scripting, storage, notifications

### Required Permissions
- `activeTab`: Access current tab
- `downloads`: Download images
- `scripting`: Inject scripts into ChatGPT pages
- `storage`: Save user preferences
- `notifications`: Show download completion notifications
- `https://chatgpt.com/library*`: Specific access to ChatGPT library

### File Structure
```
chatgpt-image-downloader/
├── manifest.json          # Extension configuration
├── popup.html             # User interface
├── popup.js               # Popup logic and communication
├── style.css              # Modern responsive styles
├── content.js             # Script that runs on ChatGPT pages
├── background.js          # Service worker for downloads
├── icon.png               # Extension icon
└── README.md              # This documentation
```

## 🛠️ Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of Chrome extensions

### Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatgpt-image-downloader.git
cd chatgpt-image-downloader
```

2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

### Testing
1. Navigate to https://chatgpt.com/library
2. Ensure you're logged in and have generated images
3. Click the extension icon and test different filters
4. Verify downloads are working correctly

## 🐛 Troubleshooting

### Extension doesn't find images
- Make sure you're on `https://chatgpt.com/library`
- Verify you're logged into ChatGPT
- Wait for the page to fully load before using the extension
- Try scrolling to load more images

### Downloads don't start
- Check if Chrome allows automatic downloads
- Verify download permissions in Chrome settings
- Ensure sufficient disk space

### Permission errors
- Make sure the extension is enabled
- Reload the ChatGPT page after installing the extension
- Verify "Developer mode" is enabled (for manual installation)

## 📋 Changelog

### Version 1.0.0
- Initial release
- Basic download functionality with filters
- Modern UI with responsive design
- Automatic file organization
- User preference persistence

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This extension is an independent project and is not affiliated with OpenAI or ChatGPT. Use at your own risk and respect ChatGPT's terms of service.

## 🔗 Links

- [Chrome Web Store](https://chrome.google.com/webstore) *(Coming soon)*
- [Report Issues](https://github.com/yourusername/chatgpt-image-downloader/issues)
- [ChatGPT Library](https://chatgpt.com/library)

## 📞 Support

If you encounter issues or have suggestions:
- Open an issue on GitHub
- Provide detailed description of the problem
- Include screenshots if necessary
- Mention your Chrome version and operating system

---

**Made with ❤️ for the ChatGPT community**
