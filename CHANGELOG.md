# Changelog

All notable changes to the ChatGPT Image Downloader extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-14

### Added
- Initial release of ChatGPT Image Downloader
- Bulk download functionality for ChatGPT Library images
- Smart filtering system with multiple options:
  - Download all available images
  - Download last N images (configurable)
  - Download images from last X days (configurable)
  - Download images from specific date
- Modern, responsive user interface with gradient design
- Real-time status updates and loading indicators
- Automatic file organization in `Downloads/ChatGPT-Images/` folder
- Intelligent file naming with timestamps
- User preference persistence using Chrome storage API
- Comprehensive error handling and user feedback
- Chrome Manifest V3 compliance for latest security standards
- Background service worker for reliable downloads
- Content script integration with ChatGPT library page
- Browser notifications for download completion
- Automatic detection of image elements using CSS selectors
- Support for `.group\/imagegen-image img` elements
- Production build system for Chrome Web Store submission
- Complete documentation and installation guides

### Technical Details
- Built with Chrome Extensions Manifest V3
- Uses modern JavaScript (ES6+) with async/await
- Responsive CSS3 design with flexbox layout
- Chrome APIs: downloads, scripting, storage, notifications, activeTab
- Minimal permissions for enhanced security
- Proper error boundaries and fallback handling
- Optimized performance with efficient DOM queries
- Cross-browser compatibility (Chrome-based browsers)

### Documentation
- Comprehensive README in English
- Portuguese installation guide
- Chrome Web Store submission guide
- GitHub setup and release instructions
- Developer documentation with code examples
- Troubleshooting guide for common issues

### Security
- Minimal required permissions
- No external API calls or data transmission
- Local storage only for user preferences
- Secure file handling and download management
- Content Security Policy compliance
- No eval() or unsafe code execution

---

## Template for Future Releases

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities
